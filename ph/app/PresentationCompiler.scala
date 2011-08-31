package compiler

import scala.tools.nsc.util._
import scala.tools.nsc.reporters.Reporter
import scala.tools.nsc.io._
import java.io.{File => JFile}
import scala.tools.nsc.interactive.{Global, Response}
import scala.tools.nsc.Settings


class PresentationCompiler(val srcs: Seq[JFile], val jars: Seq[String]) {
  import PresentationCompiler._
  
  val reporter = new PresentationReporter()
  
  // Keeps track of the files that are currently loaded into the compiler,
  // and their last modified date
  val sources = scala.collection.mutable.Map[JFile, Long]()
  
  val compiler = {
    val sep = JFile.pathSeparator
    
    // TODO: Make classpath modifiable. If I modify it do I need to tell the
    // existing compiler or create a new one?
    val settings = new Settings()
    settings.classpath.value = jars.mkString("", sep, "")
    
    // TODO: What does this do?
    /*
    settings.sourcepath.value = {
      List(appRoot).mkString("", sep, "")
    }*/
    
    val global = new Global(settings, reporter)
    
    reporter.compiler = global
    global
  }
  
  // Load the initial set of source files into the compiler
  loadSources(srcs)
  
  
  // Loads the given set of source files into the compiler
  def loadSources(srcFiles: Seq[JFile]) = {
    import scala.collection.mutable.ListBuffer
    val reload = new ListBuffer[JFile]
    
    // For each source file, if it's already in the map, check its last
    // modified date to see if it needs to be reloaded. If it's not in the
    // map, add it.
    srcFiles.foreach(src => {
      sources.get(src) match {
        case Some(lastModified) if(src.lastModified > lastModified) => reload += src
        case None => {
          reload += src
          sources.put(src, src.lastModified)
        }
        case _ =>
      }
    })
    
    
    // For each file in the map, if it's not in the list of source files,
    // remove it from the map and compiler
    sources.keySet.filter(!srcFiles.contains(_)).foreach(src => {
      sources.remove(src)
      // TODO: Should I instead call askFilesDeleted?
      compiler.removeUnitOf(toSourceFile(src))
    })
    
    
    val srcList = reload.map(toSourceFile(_)).toList
    val reloadResult = new Response[Unit]
    compiler.askReload(srcList, reloadResult)
    reloadResult.get
  }
  
  
  def compile(src: JFile): Seq[Problem] = {
    val file = toSourceFile(src)
    val typedResult = new Response[compiler.Tree]
    
    reporter.reset
    compiler.askType(file, false, typedResult)
    typedResult.get
    
    reporter.problems
  }
  
  def complete(src: JFile, line: Int, column: Int): Seq[CompleteOption] = {
    // TODO: Completion
    //val completeResult = new Response[List[compiler.Member]]
    Seq[CompleteOption]()
  }
  
  
  class PresentationReporter extends Reporter {
    import PresentationReporter._
    import scala.collection.mutable.ListBuffer
    
    var compiler: Global = null
    var problems = ListBuffer[Problem]()
    
    override def info0(pos: Position, msg: String, severity: Severity, force: Boolean): Unit = {
      severity.count += 1
      
      try {
        if(pos.isDefined) {
          //val source = pos.source
          //val length = source.identifier(pos, compiler).map(_.length).getOrElse(0)
          problems += Problem(pos, formatMessage(msg), severity.id)
        }
      } catch {
        case ex : UnsupportedOperationException => 
      }
    }
    
    override def reset {
      super.reset
      problems.clear
    }
  }
  
  object PresentationReporter {
    def formatMessage(msg: String) = {
      msg.map{
        case '\n' => ' '
        case '\r' => ' '
        case c => c
      }.mkString("","","")
    }
  }
}

object PresentationCompiler {
  def toSourceFile(file: JFile): SourceFile = new BatchSourceFile(new PlainFile(file))
  def toSourceFile(name: String): SourceFile = toSourceFile(new JFile(name))

  /* Taken from play scala plugin's ScalaCompiler */
  def scanFiles(path: JFile, regex: scala.util.matching.Regex = "^[^.].*[.](scala|java)$".r ):Seq[JFile] = {
    if(path.isDirectory) {
        path.listFiles.toSeq.collect({
            case f if f.isFile && regex.unapplySeq(f.getName).isDefined => Seq(f.getAbsoluteFile)
            case f if f.isDirectory => scanFiles(f, regex)
        }).flatten
    } else {
        Nil
    }
  }
  
  case class Problem(pos: Position, msg: String, severity: Int)
  case class CompleteOption(text: String)
}
