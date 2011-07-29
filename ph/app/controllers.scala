package controllers

import play._
import play.mvc._
import play.scalasupport.compiler._
import java.io.File
import scala.collection.JavaConversions._

object Application extends Controller {
    import views.Application._
    
    val root = "/Users/dirk/dev/projects/yabe"
    
    def index = {
        CompilerDaemon.init()
        val appRoot = new File(root)
        html.index(appRoot)
    }
}

object FileManager extends Controller {
    def load(fileName:String) = scala.io.Source.fromFile(fileName).mkString
    
    def save(fileName:String, content:String):Unit = {
        if(fileName == null || fileName.length() == 0 || content == null || content.length() == 0) {
            println("file name or content null or empty")
            return
        }
        
        play.libs.IO.writeContent(content, new File(fileName));
    }
    
    def compile(fileName:String) = {
        val json = CompilerDaemon.compile().filter(
                msg => msg.source.get.toString.equals(fileName)).map(
                msg => {"""{"source":"""" + msg.source.get + """", "row":""" + msg.line.get + """, "column":""" + msg.marker.get + """, "text":"""" + msg.message + """", "type":"""" + msg.severity + """"}"""}).mkString("[", ",", "]")
        Json(json)
    }
    /*
    import sjson.json._
    import CompilerDaemon.CompilationMessage
    implicit val CompilationMessageFormat: Format[CompilationMessage] = asProduct3("row", "column", "text", "level")(CompilerDaemon)(CompilerDaemon.unapply(_).get)
    val json:dispatch.json.JsValue = JsonSerialization.tojson(CompilerDaemon.update)
    def parse = Json(json)*/
}

object CompilerDaemon {
    import play.templates._
    
    val cacheDir = ".phcache"
    val phCache = new File(Application.root, cacheDir)
        
    def init() {
        if(phCache.exists) phCache.delete
        phCache.mkdirs
        
        val root = new File(Application.root)
        copy(root, phCache)
    }
    
    def copy(fromDir:File, toDir:File) {
        import play.libs.IO
        import java.io.{FileInputStream, FileOutputStream}
        
        fromDir.listFiles.map(fromFile =>
            if(!fromFile.getName.equals(cacheDir)) {
                if(fromFile.isDirectory) {
                    println(fromFile)
                    val newDir = new File(toDir, fromFile.getName)
                    newDir.mkdirs
                    copy(fromFile, newDir)
                } else {
                    println(fromFile)
                    val os = new FileOutputStream(new File(toDir, fromFile.getName))
                    IO.copy(new FileInputStream(fromFile), os)
                    os.flush
                    os.close
                }
            }
        )
    }

    val compiler = new PlayScalaCompiler(
        phCache,
        new File(Play.modules("scala").getRealFile, "lib"), 
        System.getProperty("java.class.path").split(System.getProperty("path.separator")).map(new File(_)).toList, 
        new File(cacheDir + "/tmp")
    )
    
    var currentSources = List[File]()

    def sources(sourcePaths:List[File]): List[File] = {
        //import play.vfs.VirtualFile
        //currentSources.empty ++ (for(p <- (Play.javaPath ++ Seq(VirtualFile.open(ScalaTemplateCompiler.generatedDirectory)))) 
        //    yield PlayScalaCompiler.scanFiles(p.getRealFile)).flatten.map(f => (f,f.lastModified))
        (for(p <- sourcePaths)
            yield PlayScalaCompiler.scanFiles(p)).flatten
    }
    
    
    def templates(sourcePaths:List[File]): Seq[File] = {
        (for(p <- sourcePaths) 
            yield PlayScalaCompiler.scanFiles(p, """^[^.].*[.]scala[.](html|txt)$""".r)).flatten
    }

    def generated(generatedDirectory: File):Seq[GeneratedSource] = {
        generatedDirectory match {
            case g if g.exists => g.listFiles.map { f =>
                GeneratedSource(f)
            }
            case _ => Seq()
        }
    }
    
    
    def compile(): List[CompilationError] = {
        val srcRoot = new File(phCache, "app")
        val generatedSource = new File(phCache, "/tmp/generated");
        generatedSource.mkdirs
        val sourcePaths = List(srcRoot, generatedSource)
        
        // Sync generated
        generated(generatedSource).foreach(_.sync())

        // Generate templates
        templates(sourcePaths).foreach(ScalaTemplateCompiler.compile(_, generatedSource))

        val newSources = sources(sourcePaths)
        //if(currentSources != newSources) {
        if(1 == 1) {
            compiler.updates(newSources, 100) match {
                case Left(errList) => errList
                case Right(r) => {
                    currentSources = newSources;
                    List()
                }
            }
        } else {
            List()
        }
    }
}