package controllers

import play._
import play.exceptions.UnexpectedException
import play.mvc._
import play.scalasupport.compiler._
import java.io.File
import scala.collection.JavaConversions._
import compiler.CompilerDaemon

object Application extends Controller {
    import views.Application._
    
    val root = "/Users/dirk/dev/projects/yabe"
    
    def index = {
        CompilerDaemon.init()
        val appRoot = new File(root)
        html.index(appRoot)
    }
    
    def test = {
        var jl = new java.util.ArrayList[Int]
        jl.add(1)
        jl.add(2)
        jl.add(3)
        
        //import scala.collection.mutable.ListBuffer
        //val t:ListBuffer[Int] = jl
        //var t:List[Int] = List[Int](jl.toArray[Int]() : _*)
        var t = jl.toList
        t = t.take(2) ::: List(7) ::: t.drop(2)
        //t(2) = 2
        t.mkString
    }
}

object FileManager extends Controller {
    import play.libs.IO
    def load(fileName:String) = IO.readContentAsString(CompilerDaemon.getFile(fileName))
    def loadHtml(fileName:String) = Html("<pre>" + IO.readContentAsString(CompilerDaemon.getFile(fileName)) + "</pre>")
    
    def deltas(fileName:String, deltas:String, compileAfter:Boolean = false) = {
        files.Delta.applyDeltas(CompilerDaemon.getFile(fileName), deltas)
        if(!compileAfter) jsonOk else compile(fileName) 
    }
    
    def save(fileName:String, checksum:Int) = {
        val orig = CompilerDaemon.getFile(fileName)
        val origChecksum = files.FIO.checksum(orig)
        if(checksum == origChecksum) {
            files.FIO.copy(orig, new File(fileName))
            jsonOk
        } else {
            jsonError("""{"ok":false,"error":"checksum"}""")
        }
    }
    
    def saveContent(fileName:String, content:String) = {
        if(content == null) {
            throw new UnexpectedException("content parameter is null")
        }
        val orig = CompilerDaemon.getFile(fileName)
        IO.writeContent(content, orig)
        files.FIO.copy(orig, new File(fileName))
        jsonOk
    }
    
    def compile(fileName:String) = {
        val cachedFile = CompilerDaemon.getFile(fileName)
        val json = CompilerDaemon.compile().filter(
                msg => msg.source.get.equals(cachedFile)).map(
                msg => {"""{"source":"""" + msg.source.get + """", "row":""" + msg.line.get + """, "column":""" + msg.marker.get + """, "text":"""" + msg.message + """", "type":"""" + msg.severity + """"}"""}).mkString("[", ",", "]")
        Json(json)
    }
    /*
    import sjson.json._
    import CompilerDaemon.CompilationMessage
    implicit val CompilationMessageFormat: Format[CompilationMessage] = asProduct3("row", "column", "text", "level")(CompilerDaemon)(CompilerDaemon.unapply(_).get)
    val json:dispatch.json.JsValue = JsonSerialization.tojson(CompilerDaemon.update)
    def parse = Json(json)*/
    
    def jsonOk() = Json("""{"ok":true}""")
    
    def jsonError(msg:String) = {
        response.status = 404
        Json(msg)
    }
}


object Project extends Controller {
    def recent(filter:String) = {
        val files = flattenFiles(new File(Application.root), filter.r).take(20)
        val json = files.map(f => {
            "\"" + f.getAbsolutePath + "\""
        }).mkString("[", ",", "]")
        Json(json)
    }

    def flattenFiles(path:File, filter: scala.util.matching.Regex):Seq[File] = {
        if(path.isDirectory && !path.equals(CompilerDaemon.phCache)) {
            path.listFiles.toSeq.collect({
                case f if f.isFile && filter.unapplySeq(f.getName).isDefined => Seq(f.getAbsoluteFile)
                case f if f.isDirectory => flattenFiles(f, filter)
            }).flatten
        } else {
            Nil
        }
    } 
}
