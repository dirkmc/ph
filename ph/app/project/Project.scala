package project

import play.libs.IO
import java.io.File
import scala.collection.JavaConversions._
import compiler.PresentationCompiler
import io.FIO


class Project(projectPath: String) {
  def cacheDirName = ".phcache"
  val cacheDir = new File(projectPath, cacheDirName)
  
  def srcDirs = Seq[String]()
  def libDirs = Seq[String]()
  def jars = Seq[String]()
  
  val compiler = {
    if(cacheDir.exists) cacheDir.delete
    cacheDir.mkdirs
    
    val root = new File(projectPath)
    copy(root, cacheDir)
    
    val sourceFiles = srcDirs.map(srcDir => FIO.scanCompilableFiles(new File(srcDir))).flatten.toSeq
    
    val allJars = {
      val libJars = libDirs.map(libDir => new File(libDir).listFiles(new java.io.FilenameFilter {
      override def accept(dir: File, name: String) = name.endsWith(".jar")
      })).flatten.map(_.getAbsolutePath)
      libJars ++ jars
    }
    
    new PresentationCompiler(sourceFiles, allJars)
  }
  
  
  def copy(fromDir:File, toDir:File) {
    import play.libs.IO
    import java.io.{FileInputStream, FileOutputStream}
    
    fromDir.listFiles.map(fromFile =>
      if(!fromFile.equals(cacheDir)) {
        if(fromFile.isDirectory) {
          val newDir = new File(toDir, fromFile.getName)
          newDir.mkdirs
          copy(fromFile, newDir)
        } else {
          FIO.copy(fromFile, new File(toDir, fromFile.getName))
        }
      }
    )
  }
  
  def getFile(filePath:String) = {
    if(!filePath.startsWith(projectPath) || filePath.length < projectPath.length + 1) {
      throw new RuntimeException("Invalid file name requested: " + filePath);
    }
    
    val relativePath = filePath.substring(projectPath.length + 1);
    new File(cacheDir, relativePath);
  }
  
  def getOriginalFile(filePath:String) = {
    val cachePath = cacheDir.getAbsolutePath
    if(!filePath.startsWith(cachePath) || filePath.length < cachePath.length + 1) {
      throw new RuntimeException("Invalid file requested: " + filePath);
    }
    
    val relativePath = filePath.substring(cachePath.length + 1);
    new File(projectPath, relativePath);
  }

  def getContents(filePath: String) = IO.readContentAsString(new File(filePath))
  
  def applyDeltas(filePath: String, deltas: String) = {
    io.Delta.applyDeltas(getFile(filePath), deltas)
  }
  
  // Returns false if the checksum doesn't match the existing file's checksum
  def saveFile(filePath: String, checkSum: Int): Boolean = {
    val existing = getFile(filePath)
    val existingCheckSum = FIO.checksum(existing)
    if(checkSum == existingCheckSum) {
      FIO.copy(existing, new File(filePath))
      true
    } else {
      false
    }
  }
  
  def saveContent(filePath: String, content: String) = {
    val cached = getFile(filePath)
    IO.writeContent(content, cached)
    FIO.copy(cached, new File(filePath))
  }
  
  def recent(filter: String) = {
    val files = FIO.scanFiles(new File(projectPath), filter.r, {!_.equals(cacheDir)})
    files.take(20)
  }
  
  
  def beforeUpdate = {}
  
  def update() {
    beforeUpdate
    val sourceFiles = srcDirs.map(srcDir => FIO.scanCompilableFiles(new File(srcDir))).flatten
    compiler.loadSources(sourceFiles)
  }
  
  def compile(filePath: String): Seq[PresentationCompiler.Problem] = {
    update()
    compiler.compile(getFile(filePath))
  }
  
  def complete(filePath: String, line: Int, column: Int): Seq[PresentationCompiler.CompleteOption] = {
    update()
    compiler.complete(getFile(filePath), line, column)
  }
}
