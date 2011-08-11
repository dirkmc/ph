package files

import play._
import play.exceptions.UnexpectedException
import play.mvc._
import play.scalasupport.compiler._
import play.libs.IO
import java.io.File
import scala.collection.JavaConversions._
import compiler.CompilerDaemon
import scala.util.matching.Regex

object AutoComplete {
    val Prefix = """^.*?([a-zA-Z_][a-zA-Z0-9_.]*$)""".r
    
    def get(file:File, cursorRow:Int, cursorColumn:Int): List[String] = {
        if(cursorColumn <= 1) return List()
        
        val line = IO.readLines(file).get(cursorRow).substring(0, cursorColumn)
        line match {
            case Prefix(identifier) => {
                List("some", "options")
            }
            
            case _ => {
                List()
            }
        }
    }
    
}
