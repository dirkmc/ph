package controllers

import play._
import play.mvc._
import play.scalasupport.compiler._
import java.io.File
import scala.collection.JavaConversions._

object Application extends Controller {
    import views.Application._
    
    val fileName = "/Users/dirk/dev/projects/yabe/app/models.scala"
    
    def index = html.index(scala.io.Source.fromFile(fileName))
}

object Parser extends Controller {
    def parse = {
        val msgs:List[CompilationError] = CompilerDaemon.update
        val json = msgs.map(msg => {"""{"row":""" + msg.line.get + """, "column":""" + msg.marker.get + """, "text":"""" + msg.message + """", "type":"""" + msg.severity + """"}"""}).mkString("[", ",", "]")
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
    val compiler = new PlayScalaCompiler(
        Play.applicationPath, 
        new File(Play.modules("scala").getRealFile, "lib"), 
        System.getProperty("java.class.path").split(System.getProperty("path.separator")).map(new File(_)).toList, 
        Play.tmpDir
    )
    
    def update:List[CompilationError] = {
        compiler.updates(List(new File(Application.fileName))) match {
            case Left(errList) => errList
            case _ => List()
        }
    }
    
    case class CompilationMessage(row: Int, column: Int, text: String, level: String)
}