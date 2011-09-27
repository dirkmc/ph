
                    package views.Application.html

                    import play.templates._
                    import play.templates.TemplateMagic._
                    import views.html._

                    object show extends BaseScalaTemplate[Html,Format[Html]](HtmlFormat) {

                        def apply/*1.2*/(
    post:(models.Post,models.User,Seq[models.Comment]),
    pagination:(Option[models.Post],Option[models.Post]),
    randomID:String
)(
    implicit 
    params:play.mvc.Scope.Params,
    flash:play.mvc.Scope.Flash,
    errors:Map[String,play.data.validation.Error]
):Html = {
                            try {
                                _display_ {

format.raw/*10.2*/("""

""")+_display_(/*12.2*/main(title = post._1.title)/*12.29*/ {format.raw/*12.31*/("""
    
    <ul id="pagination">
        """)+_display_(/*15.10*/pagination/*15.20*/._1.map/*15.27*/ { post =>format.raw/*15.37*/("""
            <li id="previous">
                <a href="""")+_display_(/*17.27*/action(controllers.Application.show(post.id())))+format.raw/*17.74*/("""">
                    """)+_display_(/*18.22*/post/*18.26*/.title)+format.raw/*18.32*/("""
                </a>
            </li>
        """)})+format.raw/*21.10*/("""
        """)+_display_(/*22.10*/pagination/*22.20*/._2.map/*22.27*/ { post =>format.raw/*22.37*/("""
            <li id="next">
                <a href="""")+_display_(/*24.27*/action(controllers.Application.show(post.id())))+format.raw/*24.74*/("""">
                    """)+_display_(/*25.22*/post/*25.26*/.title)+format.raw/*25.32*/("""
                </a>
            </li>
        """)})+format.raw/*28.10*/("""
    </ul>
    
    """)+_display_(/*31.6*/if(flash.get("success"))/*31.30*/ {format.raw/*31.32*/("""
        <p class="success">""")+_display_(/*32.29*/flash/*32.34*/.get("success"))+format.raw/*32.49*/("""</p>
    """)})+format.raw/*33.6*/("""
    
    """)+_display_(/*35.6*/display(post, mode = "full"))+format.raw/*35.34*/("""
    
    <h3>Post a comment</h3>
    
    """)+_display_(/*39.6*/form(controllers.Application.postComment(post._1.id()))/*39.61*/ {format.raw/*39.63*/("""
        
        """)+_display_(/*41.10*/if(errors)/*41.20*/ {format.raw/*41.22*/("""
            <p class="error">
                """)+_display_(/*43.18*/errors/*43.24*/.head._2)+format.raw/*43.32*/("""
            </p>
        """)})+format.raw/*45.10*/("""
        
        <p>
            <label for="author">Your name: </label>
            <input type="text" name="author" value="""")+_display_(/*49.54*/params/*49.60*/.get("author"))+format.raw/*49.74*/("""">
        </p>
        <p>
            <label for="content">Your message: </label>
            <textarea name="content">""")+_display_(/*53.39*/params/*53.45*/.get("content"))+format.raw/*53.60*/("""</textarea>
        </p>
        <p>
            <label for="code">Please type the code below: </label>
            <img src="""")+_display_(/*57.24*/action(controllers.Application.captcha(randomID)))+format.raw/*57.73*/("""">
            <br>
            <input type="text" name="code" id="code" size="18" value="">
            <input type="hidden" name="randomID" value="""")+_display_(/*60.58*/randomID)+format.raw/*60.66*/("""">
        </p>
        <p>
            <input type="submit" value="Submit your comment" />
        </p>
    """)})+format.raw/*65.6*/("""
    
    <script type="text/javascript" charset="utf-8">
        $(function() """)+format.raw("""{""")+format.raw/*68.23*/("""         
            // Expose the form 
            $('form').click(function() """)+format.raw("""{""")+format.raw/*70.41*/(""" 
                $('form').expose(""")+format.raw("""{""")+format.raw/*71.35*/("""api: true""")+format.raw("""}""")+format.raw/*71.45*/(""").load(); 
            """)+format.raw("""}""")+format.raw/*72.14*/("""); 

            // If there is an error, focus to form
            if($('form .error').size()) """)+format.raw("""{""")+format.raw/*75.42*/("""
                $('form').expose(""")+format.raw("""{""")+format.raw/*76.35*/("""api: true, loadSpeed: 0""")+format.raw("""}""")+format.raw/*76.59*/(""").load(); 
                $('form input[type=text]').get(0).focus();
            """)+format.raw("""}""")+format.raw/*78.14*/("""
        """)+format.raw("""}""")+format.raw/*79.10*/(""");
    </script>
    
""")})+format.raw/*82.2*/("""

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
                    SOURCE: /samples/yabe/.phcache/app/views/Application/show.scala.html
                    HASH: 9616f0ffc721fc513241487c510e8d347f790477
                    MATRIX: 328->1|705->271|734->274|770->301|791->303|858->343|877->353|893->360|922->370|1007->428|1075->475|1126->499|1139->503|1166->509|1244->558|1281->568|1300->578|1316->585|1345->595|1426->649|1494->696|1545->720|1558->724|1585->730|1663->779|1710->800|1743->824|1764->826|1820->855|1834->860|1870->875|1908->885|1945->896|1994->924|2064->968|2128->1023|2149->1025|2195->1044|2214->1054|2235->1056|2310->1104|2325->1110|2354->1118|2410->1145|2564->1272|2579->1278|2614->1292|2763->1414|2778->1420|2814->1435|2968->1562|3038->1611|3215->1761|3244->1769|3382->1879|3509->1959|3638->2041|3721->2077|3778->2087|3849->2111|3993->2208|4075->2243|4146->2267|4276->2350|4333->2360|4384->2383
                    LINES: 10->1|23->10|25->12|25->12|25->12|28->15|28->15|28->15|28->15|30->17|30->17|31->18|31->18|31->18|34->21|35->22|35->22|35->22|35->22|37->24|37->24|38->25|38->25|38->25|41->28|44->31|44->31|44->31|45->32|45->32|45->32|46->33|48->35|48->35|52->39|52->39|52->39|54->41|54->41|54->41|56->43|56->43|56->43|58->45|62->49|62->49|62->49|66->53|66->53|66->53|70->57|70->57|73->60|73->60|78->65|81->68|83->70|84->71|84->71|85->72|88->75|89->76|89->76|91->78|92->79|95->82
                    -- GENERATED --
                */
            
