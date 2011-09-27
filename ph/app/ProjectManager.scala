package controllers

import play.exceptions.UnexpectedException
import play.mvc._
import play.mvc.results.Result
import java.io.File
import scala.collection.JavaConversions._
import project.PlayProject

object ProjectManager extends Controller {
  import views.ProjectManager._
  
  // TODO: Do this in session/cache?
  // TODO: Need to add an expiry mechanism for projects
  val openProjects = scala.collection.mutable.HashMap[String, PlayProject]()
  def onProject(project: String, op: (PlayProject) => Result ): Result = {
    openProjects.get(project) match {
      case Some(proj) => op(proj)
      case None => NotFound
    }
  }
  
  def openProject(project: String, root: String, projectType: String) = {
    val proj = new PlayProject(root, projectType)
    openProjects += (project -> proj)
    html.project(project, new File(root))
  }
  
  
  def load(project: String, filePath: String) = {
    onProject(project, { proj => Text(proj.getContents(filePath)) })
  }
  def loadHtml(project: String, filePath: String) = Html("<pre>" + load(project, filePath) + "</pre>")
  
  def deltas(project: String, filePath:String, deltas:String, cursorRow:Int, cursorColumn:Int, compile:Boolean = false, autoComplete:Boolean = false) = {
    onProject(project, { proj =>
      proj.applyDeltas(filePath, deltas)
      
      var json = "";
      if(autoComplete) {
        val options = proj.complete(filePath, cursorRow, cursorColumn)
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
        json += "\"compile\":" + compileJson(proj, filePath)
      }
      
      if(json.length > 0) Json("{"+json+"}") else jsonOk
    })
  }
  
  def save(project: String, filePath:String, checkSum:Int) = {
    onProject(project, { proj =>
      if(proj.saveFile(filePath, checkSum)) {
        jsonOk
      } else {
        jsonError("""{"ok":false,"error":"checksum"}""")
      }
    })
  }
  
  def saveContent(project: String, filePath:String, content:String) = {
    // Sanity check
    if(content == null) {
      throw new UnexpectedException("content parameter is null")
    }
    onProject(project, { proj =>
      proj.saveContent(filePath, content)
      jsonOk
    })
  }
  
  def recent(project: String, filter:String) = {
    onProject(project, { proj =>
      val files = proj.recent(filter)
      val json = files.map(f => {
        "\"" + f.getAbsolutePath + "\""
      }).mkString("[", ",", "]")
      Json(json)
    })
  }
  
  
  def compile(project: String, filePath:String) = {
    onProject(project, { proj => Json("{\"compile\":" + compileJson(proj, filePath) + "}") })
  }
  
  def compileJson(proj: PlayProject, filePath:String) = {
    def getType(severity: Int) = severity match {
      case 1 => "warning"
      case 2 => "error"
      case _ => "ignore"
    }
      
    proj.compile(filePath).map(prob => {
      // TODO: Do this inside project
      val src = proj.getOriginalFile(prob.pos.source).getAbsolutePath
        
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
