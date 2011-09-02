package io

import java.io.File
import scala.collection.JavaConversions._

object FIO {
  import play.libs.IO
  
  // Simple checksum (Couldn't get JS CRC32 to work)
  def checksum(file:File) = {
    var value = IO.readContent(file)
    var checksum = value.length
    value.map( c => {
        checksum = (checksum + c) % 2147483647
    })
    
    checksum
  }

  def copy(source:File, dest:File) {
    import java.io.{FileInputStream, FileOutputStream}
    IO.write(new FileInputStream(source), new FileOutputStream(dest))
  }
  
  //
  // Get a list of all files in the given directory, with file name filtered by
  // regex. The recurse function indicates whether to recurse into a directory
  // or not.
  //
  def scanFiles(dir: File, regex: scala.util.matching.Regex, recurse: (File) => Boolean = {_=>true}): Seq[File] = {
    if(dir.isDirectory && recurse(dir)) {
        dir.listFiles.toSeq.collect({
            case f if f.isFile && regex.unapplySeq(f.getName).isDefined => Seq(f.getAbsoluteFile)
            case f if f.isDirectory => scanFiles(f, regex)
        }).flatten
    } else {
        Nil
    }
  }
  
  def scanCompilableFiles(dir: File) = scanFiles(dir, "^[^.].*[.](scala|java)$".r)
    
}
