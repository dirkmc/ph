
                    package views.Application.html

                    import play.templates._
                    import play.templates.TemplateMagic._
                    import views.html._

                    object index extends BaseScalaTemplate[Html,Format[Html]](HtmlFormat) {

                        def apply/*1.2*/(
    front:Option[(models.Post,models.User,Seq[models.Comment])], 
    older:Seq[(models.Post,models.User,Seq[models.Comment])]
):Html = {
                            try {
                                _display_ {

format.raw/*4.2*/("""

""")+_display_(/*6.2*/main(title = "Home")/*6.22*/ {format.raw/*6.24*/("""
    
    """)+_display_(/*8.6*/front/*8.11*/.map/*8.15*/ { front =>format.raw/*8.26*/("""
        
        """)+_display_(/*10.10*/display(front, mode = "home"))+format.raw/*10.39*/("""

        """)+_display_(/*12.10*/Option(older)/*12.23*/.filterNot(_.isEmpty).map/*12.48*/ { posts =>format.raw/*12.59*/("""

            <div class="older-posts">    
                <h3>Older posts <span class="from">from this blog</span></h3>

                """)+_display_(/*17.18*/posts/*17.23*/.map/*17.27*/ { post =>format.raw/*17.37*/("""
                    """)+_display_(/*18.22*/display(post, mode = "teaser"))+format.raw/*18.52*/("""
                """)})+format.raw/*19.18*/("""

            </div> 

        """)})+format.raw/*23.10*/("""

    """)}/*25.6*/.getOrElse/*25.16*/ {format.raw/*25.18*/("""

        <div class="empty">
            There is currently nothing to read here.
        </div>

    """)})+format.raw/*31.6*/("""
    
""")})+format.raw/*33.2*/("""


""")}
                            } catch {
                                case e:TemplateExecutionError => throw e
                                case e => throw Reporter.toHumanException(e)
                            }
                        }

                    }

                
                /*
                    -- GENERATED --
                    DATE: Tue Sep 27 13:33:59 GMT-03:00 2011
                    SOURCE: /samples/yabe/.phcache/app/views/Application/index.scala.html
                    HASH: 32f5a062d8a6d3a23b59b2426b12f31e9fdf0452
                    MATRIX: 329->1|565->131|593->134|621->154|641->156|677->167|690->172|702->176|731->187|777->206|827->235|865->246|887->259|921->284|951->295|1118->435|1132->440|1145->444|1174->454|1223->476|1274->506|1321->524|1382->556|1405->563|1424->573|1445->575|1577->679|1612->686
                    LINES: 10->1|17->4|19->6|19->6|19->6|21->8|21->8|21->8|21->8|23->10|23->10|25->12|25->12|25->12|25->12|30->17|30->17|30->17|30->17|31->18|31->18|32->19|36->23|38->25|38->25|38->25|44->31|46->33
                    -- GENERATED --
                */
            
