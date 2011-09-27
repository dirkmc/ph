
                    package views.html

                    import play.templates._
                    import play.templates.TemplateMagic._
                    import views.html._

                    object main extends BaseScalaTemplate[Html,Format[Html]](HtmlFormat) {

                        def apply/*1.2*/(title:String = "")(body: => Html):Html = {
                            try {
                                _display_ {

format.raw/*1.36*/("""

<!DOCTYPE html >
<html>
    <head>
        <title>""")+_display_(/*6.17*/title)+format.raw/*6.22*/("""</title>		
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <link rel="stylesheet" media="screen" href="""")+_display_(/*8.54*/asset("public/stylesheets/main.css"))+format.raw/*8.90*/("""">
        <link rel="shortcut icon" type="image/png" href="""")+_display_(/*9.59*/asset("public/images/favicon.png"))+format.raw/*9.93*/("""">
        <script src="""")+_display_(/*10.23*/asset("public/javascripts/jquery-1.5.2.min.js"))+format.raw/*10.70*/("""" type="text/javascript"></script>
        <script src="""")+_display_(/*11.23*/asset("public/javascripts/jquery.tools.min.js"))+format.raw/*11.70*/("""" type="text/javascript"></script>
    </head>
    <body>
        
        <div id="header">
            <div id="logo">
                yabe.
            </div>
            <ul id="tools">
                <li>
                    <a href="#">Log in to write something</a>
                </li>
            </ul>
            <div id="title">
                <span class="about">About this blog</span>
                <h1>
                    <a href="""")+_display_(/*27.31*/action(controllers.Application.index))+format.raw/*27.68*/("""">
                        """)+_display_(/*28.26*/play/*28.30*/.Play.configuration.get("blog.title"))+format.raw/*28.67*/("""
                    </a>
                </h1>
                <h2>""")+_display_(/*31.22*/play/*31.26*/.Play.configuration.get("blog.baseline"))+format.raw/*31.66*/("""</h2>
            </div>
        </div>
        
        <div id="main">
            """)+_display_(/*36.14*/body)+format.raw/*36.18*/("""
        </div>
        
        <p id="footer">
            Yabe is a (not that) powerful blog engine built with the 
            <a href="http://www.playframework.org">Play framework</a>
            as a tutorial application.
        </p>
        
    </body>
</html>
""")}
                            } catch {
                                case e:TemplateExecutionError => throw e
                                case e => throw Reporter.toHumanException(e)
                            }
                        }

                    }

                
                /*
                    -- GENERATED --
                    DATE: Tue Sep 27 13:34:00 GMT-03:00 2011
                    SOURCE: /samples/yabe/.phcache/app/views/main.scala.html
                    HASH: 99f8e3d64a9f1b1761fa4bfa15acc8d9c41ddfd3
                    MATRIX: 316->1|457->35|536->88|561->93|728->234|784->270|871->331|925->365|977->390|1045->437|1129->494|1197->541|1676->993|1734->1030|1789->1058|1802->1062|1860->1099|1956->1168|1969->1172|2030->1212|2143->1298|2168->1302
                    LINES: 10->1|14->1|19->6|19->6|21->8|21->8|22->9|22->9|23->10|23->10|24->11|24->11|40->27|40->27|41->28|41->28|41->28|44->31|44->31|44->31|49->36|49->36
                    -- GENERATED --
                */
            
