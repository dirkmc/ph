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

object Delta {
    val Insert = """\+(\d+),(\d+),(.*)""".r
    val Delete = """\-(\d+),(\d+),(\d+)""".r
    val newLinePattern = java.util.regex.Pattern.compile("\n")
    
    def applyDeltas(file:File, serializedDeltas:String) = {
        var lines = IO.readLines(file).toList
        val deltas = serializedDeltas.split("\n").map(delta => delta match {
            case Insert(colI, rowI, textS) => {
                val text = textS.replace("\\n", "\n")
                val col = colI.toInt
                val row = rowI.toInt
                
                // Add the new text in the appropriate place, then split it into lines again
                val line = lines(row).substring(0, col) + text + lines(row).substring(col)
                // -1 means trailing empty strings are not discarded from resulting array
                val newLines = newLinePattern.split(line, -1)
                lines = lines.take(row) ::: newLines.toList ::: lines.drop(row + 1)
            }
            
            case Delete(colI, rowI, lengthI) => {
                val col = colI.toInt
                val row = rowI.toInt
                val length = lengthI.toInt
                
                var replaceLines = List[String]()
                var remaining = length;
                var linePos = col
                var rowCount = 0
                while(remaining >= 0) {
                    replaceLines = replaceLines ::: List(lines(row + rowCount))
                    // -1 because of the \n at the end of the line
                    remaining = remaining - (lines(row + rowCount).length - linePos) - 1
                    linePos = 0
                    rowCount += 1
                }
                
                // Replace the required amount of text
                val singleLine = replaceLines.mkString("\n")
                val line = singleLine.substring(0, col) + singleLine.substring(col + length)
                
                // Add the line back into the list of lines
                lines = lines.take(row) ::: List(line) ::: lines.drop(row + rowCount)
            }
            
            case _ => {
                throw new UnexpectedException("Invalid delta format: " + delta)
            }
        })
        
        IO.writeContent(lines.mkString("\n"), file)
    }
    
}
