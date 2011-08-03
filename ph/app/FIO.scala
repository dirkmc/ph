package files

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
}
