package project

import java.io.File
import scala.collection.JavaConversions._
import play.templates._
import io.FIO


class PlayProject(projectPath: String, projectType: String) extends Project(projectPath, projectType) {
  import PlayProject._
  
  lazy val srcRoot = new File(cacheDir, "app")
  lazy val generatedSrcDir = new File(cacheDir, "/tmp/generated");
  lazy val playRoot = "/Users/dirk/dev/play-releases/play-head"
  
  override def srcDirs = {
    generatedSrcDir.mkdirs
    Seq(srcRoot, generatedSrcDir)
  }
  
  override def libDirs = {
    val playLibs = playRoot + "/framework/lib"
    val scalaLibs = "/Users/dirk/dev/frameworks/play-scala-dirkmc/lib"
    Seq(new File(playLibs), new File(scalaLibs))
  }
  
  override def jars = Seq(new File(playRoot + "/framework/play-1.2.x-ec5dcf4.jar"))

  
  override def beforeUpdate() {
    // Sync generated
    generated(generatedSrcDir).foreach(_.sync())

    // Generate templates
    // TODO: Check if template file has actually changed before generating
    import play.templates.ScalaTemplateCompiler
    templates(srcDirs).foreach(ScalaTemplateCompiler.compile(_, generatedSrcDir))
  }
}

object PlayProject {
  def generated(generatedDir: File):Seq[GeneratedSource] = {
    generatedDir match {
      case g if g.exists => g.listFiles.map { f =>
        GeneratedSource(f)
      }
      case _ => Seq()
    }
  }
  
  def templates(sourceDirs: Seq[File]): Seq[File] = {
    val regex = """^[^.].*[.]scala[.](html|txt)$""".r
    sourceDirs.map(srcDir => FIO.scanFiles(srcDir, regex)).flatten
  }
}
