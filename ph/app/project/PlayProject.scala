package project

import java.io.File
import scala.collection.JavaConversions._
import play.templates._
import io.FIO


class PlayProject(projectPath: String) extends Project(projectPath) {
  import PlayProject._
  
  lazy val srcRoot = new File(cacheDir, "app")
  lazy val generatedSource = new File(cacheDir, "/tmp/generated");
  lazy val playRoot = "/Users/dirk/dev/play-releases/play-head"
  
  override def srcDirs = {
    generatedSource.mkdirs
    Seq(srcRoot.getAbsolutePath, generatedSource.getAbsolutePath)
  }
  
  override def libDirs = {
    val playLibs = playRoot + "/framework/lib"
    val scalaLibs = "/Users/dirk/dev/frameworks/play-scala-dirkmc/lib"
    Seq(playLibs, scalaLibs)
  }
  
  override def jars = Seq(playRoot + "/framework/play-1.2.x-ec5dcf4.jar")

  
  override def beforeUpdate() {
    // Sync generated
    generated(generatedSource).foreach(_.sync())

    // Generate templates
    // TODO: Check if template file has actually changed before generating
    import play.templates.ScalaTemplateCompiler
    templates(srcDirs).foreach(ScalaTemplateCompiler.compile(_, generatedSource))
  }
}

object PlayProject {
  def generated(generatedDirectory: File):Seq[GeneratedSource] = {
    generatedDirectory match {
      case g if g.exists => g.listFiles.map { f =>
        GeneratedSource(f)
      }
      case _ => Seq()
    }
  }
  
  def templates(sourcePaths: Seq[String]): Seq[File] = {
    val regex = """^[^.].*[.]scala[.](html|txt)$""".r
    sourcePaths.map(sourcePath => FIO.scanFiles(new File(sourcePath), regex)).flatten
  }
}
