package controllers

import play.mvc._

object Application extends Controller {
  import views.Application._
  
  def index = {
    html.index()
  }
}
