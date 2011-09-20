package controllers

import play.exceptions.UnexpectedException
import play.mvc._
import java.io.File
import scala.collection.JavaConversions._
import project.PlayProject

object Application extends Controller {
  import views.Application._
  
  def root = "/Users/dirk/dev/projects/yabe"
  
  def index = {
    // TODO: Retrieve project based on request parameter
    ProjectManager.project = new PlayProject(Application.root)
    html.index(new File(root))
  }
}

object ProjectManager extends Controller {
  //val project = new PlayProject(Application.root)
  var project:PlayProject = null
  
  def load(filePath:String) = project.getContents(filePath)
  def loadHtml(filePath:String) = Html("<pre>" + load(filePath) + "</pre>")
  
  def deltas(filePath:String, deltas:String, cursorRow:Int, cursorColumn:Int, compile:Boolean = false, autoComplete:Boolean = false) = {
    project.applyDeltas(filePath, deltas)
    
    var json = "";
    if(autoComplete) {
      val options = project.complete(filePath, cursorRow, cursorColumn)
      val optionsString = options.map(o => {
        "{" +
          "\"kind\":\"" + o.kind + "\"," +
          "\"name\":\"" + o.name + "\"," +
          "\"fullName\":\"" + o.fullName + "\"," +
          "\"replaceText\":\"" + o.replaceText + "\"," +
          "\"cursorPos\":" + o.cursorPos + "," +
          "\"symType\":\"" + o.symType + "\"" +
        "}"
      }).mkString("[", ",", "]")
      
      json += "\"autoComplete\":{" +
        "\"options\":" + optionsString + "," +
        "\"row\":" + cursorRow + "," +
        "\"column\":" + cursorColumn +
        "}"
    }
    if(compile) {
      if(json.length > 0) json += ","
      json += "\"compile\":" + compileJson(filePath)
    }
    
    if(json.length > 0) Json("{"+json+"}") else jsonOk
  }
  
  def save(filePath:String, checkSum:Int) = {
    if(project.saveFile(filePath, checkSum)) {
      jsonOk
    }
    else {
      jsonError("""{"ok":false,"error":"checksum"}""")
    }
  }
  
  def saveContent(filePath:String, content:String) = {
    if(content == null) {
      throw new UnexpectedException("content parameter is null")
    }
    project.saveContent(filePath, content)
    jsonOk
  }
  
  def recent(filter:String) = {
    val files = project.recent(filter)
    val json = files.map(f => {
      "\"" + f.getAbsolutePath + "\""
    }).mkString("[", ",", "]")
    Json(json)
  }
  
  
  def compile(filePath:String) = Json(compileJson(filePath))
  def compileJson(filePath:String) = {
    def getType(severity: Int) = severity match {
      case 1 => "warning"
      case 2 => "error"
      case _ => "ignore"
    }
    
    project.compile(filePath).map(prob => {
      val src = project.getOriginalFile(prob.pos.source.path).getAbsolutePath
      "{" +
      "\"source\":\"" + src + "\"," +
      "\"row\":" + prob.pos.line + "," +
      "\"column\":" + prob.pos.column + "," +
      "\"text\":\"" + prob.msg.replace("\"", "\\\"").replace("\n", "") + "\"," +
      "\"type\":\"" + getType(prob.severity) + "\"" +
      "}"
    }).mkString("[", ",", "]")
  }
  
  def jsonOk() = Json("""{"ok":true}""")
  
  def jsonError(msg:String) = {
    response.status = 400
    Json(msg)
  }
}
