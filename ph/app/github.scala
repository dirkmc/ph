package controllers

import play.exceptions.UnexpectedException
import play.mvc.Controller
import play.libs.WS
import scala.collection.JavaConversions._

case class Repo(name: String, url: String)

object GitHub extends Controller {
  import views.GitHub._
  
  def requestAuth = {
    Redirect("https://github.com/login/oauth/authorize?client_id=61049ecd98284a1bf12b&scope=repo")
  }
  
  def auth(code: String) = {
    val response = WS.url("https://github.com/login/oauth/access_token").
      setParameter("client_id", "61049ecd98284a1bf12b").
      setParameter("client_secret", "5b067b7699be7e5b1fb4ef28086af613234a3e9f").
      setParameter("code", code).post()
      
    val accessToken = response.getQueryString().get("access_token");
    if(accessToken == null) {
      "error: " + response.getString()
      // TODO: error
    } else {
      Action(repos(accessToken))
    }
  }
  
  def user(accessToken: String) = {
    val response = WS.url("https://api.github.com/user").
      setParameter("access_token", accessToken).get()
    
    "Response: " + response.getString()
  }
  
  def repos(accessToken: String) = {
    val response = WS.url("https://api.github.com/user/repos").
      setParameter("access_token", accessToken).get()
    
    import com.codahale.jerkson.Json._
    val repos = parse[List[Repo]](response.getString())
    html.repos(repos)
  }
  

}
