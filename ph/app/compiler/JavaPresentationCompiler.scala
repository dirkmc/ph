package compiler

import java.io._
import java.io.{File => JFile}
import org.eclipse.jdt.core.compiler.IProblem
import org.eclipse.jdt.internal.compiler._
import org.eclipse.jdt.internal.compiler.batch.FileSystem
import org.eclipse.jdt.internal.compiler.env._
import org.eclipse.jdt.internal.compiler.impl.CompilerOptions
import org.eclipse.jdt.internal.compiler.problem.DefaultProblemFactory
import play.exceptions.UnexpectedException;
import PresentationCompiler._


// TODO: Make this class thread safe
// Can I use the incremental compiler or is this it?
class JavaPresentationCompiler(val srcs: Seq[SourceFile], val jars: Seq[JFile])
    extends PresentationCompiler {
  
  
  val reporter = new CompilerRequestor
    
  val compiler = {
    val settings = scala.collection.mutable.Map[String, String]();
    settings.put(CompilerOptions.OPTION_ReportMissingSerialVersion, CompilerOptions.IGNORE);
    settings.put(CompilerOptions.OPTION_LineNumberAttribute, CompilerOptions.GENERATE);
    settings.put(CompilerOptions.OPTION_SourceFileAttribute, CompilerOptions.GENERATE);
    settings.put(CompilerOptions.OPTION_ReportDeprecation, CompilerOptions.IGNORE);
    settings.put(CompilerOptions.OPTION_ReportUnusedImport, CompilerOptions.IGNORE);
    settings.put(CompilerOptions.OPTION_Encoding, "UTF-8");
    settings.put(CompilerOptions.OPTION_LocalVariableAttribute, CompilerOptions.GENERATE);
    
    val javaVersion = CompilerOptions.VERSION_1_6;
    settings.put(CompilerOptions.OPTION_Source, javaVersion);
    settings.put(CompilerOptions.OPTION_TargetPlatform, javaVersion);
    settings.put(CompilerOptions.OPTION_PreserveUnusedLocal, CompilerOptions.PRESERVE);
    settings.put(CompilerOptions.OPTION_Compliance, javaVersion);
    
    val policy = DefaultErrorHandlingPolicies.exitAfterAllProblems()
    val problemFactory = new DefaultProblemFactory(java.util.Locale.ENGLISH)
    
    val classPath = {
      val srcDirs = srcs.map(_.srcDir.getAbsolutePath).distinct
      // TODO: Figure out how to get this system-independently
      val rtJar = "/System/Library/Java/JavaVirtualMachines/1.6.0.jdk/Contents/Classes/classes.jar"
      srcDirs ++ jars.map(_.getAbsolutePath) ++ Seq(rtJar)
    }
    val nameEnvironment = new FileSystem(classPath.toArray, Array[String](), "UTF-8");
    
    import scala.collection.JavaConversions._
    new Compiler(nameEnvironment, policy, new CompilerOptions(settings), reporter, problemFactory)
  }
  
  
  // Load the initial set of source files into the compiler
  loadSources(srcs)
  
  // Loads the given set of source files into the compiler
  override def loadSources(srcFiles: Seq[SourceFile]) = {
    val (updated, deleted) = updateSources(srcFiles)
    
    // TODO: How do I remove deleted files from the compiler?
    
    compiler.compile(updated.map(src => new CompilationUnit(src)).toArray)
  }
  
  
  override def compile(src: SourceFile): Seq[Problem] = {
    reporter.reset
    compiler.compile(Array(new CompilationUnit(src)))
    reporter.problems
  }

  
  /**
   * Implements eclipse interface to a source file
   */
  class CompilationUnit(file: SourceFile) extends ICompilationUnit {
    val filePath = file.src.getAbsolutePath
    val rootPath = file.srcDir.getAbsolutePath
    val pClazzName = filePath.replace(rootPath, "").
      replaceAll("\\.java$", "").replaceAll("^/", "").replace('/', '.')
    
    val typeName = {
      val dot = pClazzName.lastIndexOf('.');
      if (dot > 0) {
        pClazzName.substring(dot + 1).toCharArray();
      } else {
        pClazzName.toCharArray();
      }
    }
    
    val packageName = pClazzName.split("\\.").dropRight(1).map(_.toCharArray).toArray
    
    override def getFileName = filePath.toCharArray

    override def getContents = {
      import play.libs.IO
      IO.readContentAsString(new File(filePath)).toCharArray()
    }

    override def getMainTypeName = typeName

    override def getPackageName = packageName
  }
  
  /**
   * Collects problems each time the compiler is called
   */
  class CompilerRequestor extends ICompilerRequestor {
    val problems = scala.collection.mutable.ListBuffer[Problem]()

    override def acceptResult(result: CompilationResult) {
      if(result.hasErrors) {
        result.getErrors.foreach(problem => {
          // TODO: This is what they do in the play equivalent of this class:
          val message = if(problem.getID() == IProblem.CannotImportPackage) {
            problem.getArguments()(0) + " cannot be resolved";
          } else {
            problem.getMessage
          }
        
          val pos = Position(new String(problem.getOriginatingFileName), problem.getSourceLineNumber, 0)
          val severity = if(problem.isError) 2 else if(problem.isWarning) 1 else 0
          problems += Problem(pos, message, severity)
        })
      }
    }
    
    def reset = problems.clear
  }
}
