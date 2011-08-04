package compiler

import play._
import play.exceptions.UnexpectedException
import play.mvc._
import play.scalasupport.compiler._
import java.io.File
import scala.collection.JavaConversions._
import controllers.Application


object CompilerDaemon {
    import play.templates._
    
    val cacheDir = ".phcache"
    val phCache = new File(Application.root, cacheDir)
        
    def init() {
        if(phCache.exists) phCache.delete
        phCache.mkdirs
        
        val root = new File(Application.root)
        copy(root, phCache)
    }
    
    def copy(fromDir:File, toDir:File) {
        import play.libs.IO
        import java.io.{FileInputStream, FileOutputStream}
        
        fromDir.listFiles.map(fromFile =>
            if(!fromFile.getName.equals(cacheDir)) {
                if(fromFile.isDirectory) {
                    val newDir = new File(toDir, fromFile.getName)
                    newDir.mkdirs
                    copy(fromFile, newDir)
                } else {
                    files.FIO.copy(fromFile, new File(toDir, fromFile.getName))
                }
            }
        )
    }
    
    def getFile(fileName:String) = {
        if(!fileName.startsWith(Application.root) || fileName.length < Application.root.length + 1) {
            throw new UnexpectedException("Invalid file name requested: " + fileName);
        }
        
        val relativePath = fileName.substring(Application.root.length + 1);
        new File(phCache, relativePath);
    }

    val compiler = new PlayScalaCompiler(
        phCache,
        new File(Play.modules("scala").getRealFile, "lib"), 
        System.getProperty("java.class.path").split(System.getProperty("path.separator")).map(new File(_)).toList, 
        new File(cacheDir + "/tmp")
    )
    
    var currentSources = List[File]()

    def sources(sourcePaths:List[File]): List[File] = {
        //import play.vfs.VirtualFile
        //currentSources.empty ++ (for(p <- (Play.javaPath ++ Seq(VirtualFile.open(ScalaTemplateCompiler.generatedDirectory)))) 
        //    yield PlayScalaCompiler.scanFiles(p.getRealFile)).flatten.map(f => (f,f.lastModified))
        (for(p <- sourcePaths)
            yield PlayScalaCompiler.scanFiles(p)).flatten
    }
    
    
    def templates(sourcePaths:List[File]): Seq[File] = {
        (for(p <- sourcePaths) 
            yield PlayScalaCompiler.scanFiles(p, """^[^.].*[.]scala[.](html|txt)$""".r)).flatten
    }

    def generated(generatedDirectory: File):Seq[GeneratedSource] = {
        generatedDirectory match {
            case g if g.exists => g.listFiles.map { f =>
                GeneratedSource(f)
            }
            case _ => Seq()
        }
    }
    
    
    def compile(): List[CompilationError] = {
        val srcRoot = new File(phCache, "app")
        val generatedSource = new File(phCache, "/tmp/generated");
        generatedSource.mkdirs
        val sourcePaths = List(srcRoot, generatedSource)
        
        // Sync generated
        generated(generatedSource).foreach(_.sync())

        // Generate templates
        templates(sourcePaths).foreach(ScalaTemplateCompiler.compile(_, generatedSource))

        val newSources = sources(sourcePaths)
        //if(currentSources != newSources) {
        if(1 == 1) {
            compiler.updateWithErrors(newSources, 100) match {
                case Left(errList) => errList
                case Right(r) => {
                    currentSources = newSources;
                    List()
                }
            }
        } else {
            List()
        }
    }
}