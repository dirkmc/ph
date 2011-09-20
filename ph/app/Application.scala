package controllers

import play.exceptions.UnexpectedException
import play.mvc._
import java.io.File
import scala.collection.JavaConversions._
import project.PlayProject

object Application extends Controller {
  import views.Application._
  
  def index = {
    html.index()
  }
}
