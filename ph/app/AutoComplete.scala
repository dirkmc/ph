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
import scala.tools.nsc.util._
import scala.tools.nsc.reporters._
import scala.tools.nsc.io._
import scala.tools.nsc.interactive.{Global, Response}
import scala.tools.nsc.Settings


object AutoComplete {
    val settings = new Settings(println)
    val reporter = new ConsoleReporter(settings)
    val comp = new Global(settings, reporter)
    val structureResult = new Response[comp.Tree]
    val reloadResult = new Response[Unit]
    val typeatResult = new Response[comp.Tree]
    val typedResult = new Response[comp.Tree]
    val completeResult = new Response[List[comp.Member]]

    def toSourceFile(file: File) = new BatchSourceFile(new PlainFile(file))

    def using[T, U](svar: Response[T])(op: T => U): Option[U] = {
        val res = svar.get match {
            case Left(result) => Some(op(result))
            case Right(exc) => exc.printStackTrace; println("ERROR: "+exc); None
        }
        svar.clear()
        res
    }

    def show[T](svar: Response[T]) = using(svar)(res => println("==> "+res))

    
    val Prefix = """^.*?([a-zA-Z_][a-zA-Z0-9_.]*$)""".r
    def get(file:File, cursorRow:Int, cursorColumn:Int): List[String] = {
        if(cursorColumn <= 1) return List()
        
        val source = toSourceFile(file)
        comp.askReload(List(source), reloadResult)
        reloadResult.clear
        comp.askTypeCompletion(source.position(cursorRow, cursorColumn), completeResult)
        
        completeResult.get match {
            case Left(optionList) => {
                val res = optionList.map(_.toString)
                completeResult.clear
                return res
            }
            case _ => {
                completeResult.clear
                return List()
            }
        }

        
        /*
        val line = IO.readLines(file).get(cursorRow).substring(0, cursorColumn)
        line match {
            case Prefix(identifier) => {
                List("some", "options")
            }
            
            case _ => {
                List()
            }
        }*/
    }
    
    
}
