package compiler

import scala.tools.nsc.util._
import scala.tools.nsc.reporters.Reporter
import scala.tools.nsc.io._
import java.io.{File => JFile}
import scala.tools.nsc.interactive.{Global, Response}
import scala.tools.nsc.Settings


trait PresentationCompiler {
  import PresentationCompiler._
  
  // Loads the given set of source files into the compiler
  def loadSources(srcFiles: Seq[JFile])
  
  def compile(src: JFile): Seq[Problem] = Seq()
  
  def complete(src: JFile, line: Int, column: Int): Seq[CompleteOption] = Seq()
}

object PresentationCompiler {
  case class Problem(pos: Position, msg: String, severity: Int)
  case class CompleteOption(kind: String, name: String, fullName: String, replaceText: String, cursorPos: Int, symType: String)
}
