
                    package views.Application.html

                    import play.templates._
                    import play.templates.TemplateMagic._
                    import views.html._

                    object display extends BaseScalaTemplate[Html,Format[Html]](HtmlFormat) {

                        def apply/*1.2*/(post:(models.Post,models.User,Seq[models.Comment]), mode: String = "full"):Html = {
                            try {
                                _display_ {
def /*3.2*/commentsTitle/*3.15*/ = {

format.raw/*3.19*/("""
    """)+_display_(/*4.6*/if(post._3)/*4.17*/ {format.raw/*4.19*/("""
        """)+_display_(/*5.10*/post/*5.14*/._3.size)+format.raw/*5.22*/(""" comments, latest by """)+_display_(/*5.44*/post/*5.48*/._3(0).author)+format.raw/*5.61*/("""
    """)}/*6.7*/else/*6.12*/{format.raw/*6.13*/("""
        no comments
    """)})+format.raw/*8.6*/("""
""")};
format.raw/*1.77*/("""

""")+format.raw/*9.2*/("""
 
<div class="post """)+_display_(/*11.19*/mode)+format.raw/*11.23*/("""">
    <h2 class="post-title">
        <a href="""")+_display_(/*13.19*/action(controllers.Application.show(post._1.id())))+format.raw/*13.69*/("""">""")+_display_(/*13.72*/post/*13.76*/._1.title)+format.raw/*13.85*/("""</a>
    </h2>
    <div class="post-metadata">
        <span class="post-author">by """)+_display_(/*16.39*/post/*16.43*/._2.fullname)+format.raw/*16.55*/("""</span>,
        <span class="post-date">
            """)+_display_(/*18.14*/post/*18.18*/._1.postedAt.format("dd MMM yy"))+format.raw/*18.50*/("""
        </span>
        """)+_display_(/*20.10*/if(mode != "full")/*20.28*/ {format.raw/*20.30*/("""
            <span class="post-comments">
                """)+_display_(/*22.18*/commentsTitle)+format.raw/*22.31*/("""
            </span>
        """)})+format.raw/*24.10*/("""
    </div>
    """)+_display_(/*26.6*/if(mode != "teaser")/*26.26*/ {format.raw/*26.28*/("""
        <div class="post-content">
            <div class="about">Detail: </div>
            """)+_display_(/*29.14*/Html(post._1.content.replace("\n", "<br>")))+format.raw/*29.57*/("""
        </div>
    """)})+format.raw/*31.6*/("""
</div>

""")+_display_(/*34.2*/if(mode == "full")/*34.20*/ {format.raw/*34.22*/("""
    
    <div class="comments">
        <h3>
            """)+_display_(/*38.14*/commentsTitle)+format.raw/*38.27*/("""
        </h3>
        
        """)+_display_(/*41.10*/post/*41.14*/._3.map/*41.21*/ { comment =>format.raw/*41.34*/("""
            <div class="comment">
                <div class="comment-metadata">
                    <span class="comment-author">by """)+_display_(/*44.54*/comment/*44.61*/.author)+format.raw/*44.68*/(""",</span>
                    <span class="comment-date">
                        """)+_display_(/*46.26*/comment/*46.33*/.postedAt.format("dd MMM yy"))+format.raw/*46.62*/("""
                    </span>
                </div>
                <div class="comment-content">
                    <div class="about">Detail: </div>
                    """)+_display_(/*51.22*/Html(comment.content.replace("\n", "<br>")))+format.raw/*51.65*/("""
                </div>
            </div>
        """)})+format.raw/*54.10*/("""
        
    </div>
    
""")})+format.raw/*58.2*/("""
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
                    SOURCE: /samples/yabe/.phcache/app/views/Application/display.scala.html
                    HASH: 6d07ffac072fb8be42a3652e253ed782865359b8
                    MATRIX: 331->1|505->79|526->92|550->96|581->102|600->113|620->115|656->125|668->129|696->137|744->159|756->163|789->176|810->183|822->188|841->189|894->215|924->76|952->217|1000->238|1025->242|1101->291|1172->341|1202->344|1215->348|1245->357|1357->442|1370->446|1403->458|1485->513|1498->517|1551->549|1604->575|1631->593|1652->595|1738->654|1772->667|1831->697|1874->714|1903->734|1924->736|2046->831|2110->874|2159->895|2195->905|2222->923|2243->925|2329->984|2363->997|2423->1030|2436->1034|2452->1041|2484->1054|2646->1189|2662->1196|2690->1203|2799->1285|2815->1292|2865->1321|3065->1494|3129->1537|3210->1589|3265->1616
                    LINES: 10->1|13->3|13->3|15->3|16->4|16->4|16->4|17->5|17->5|17->5|17->5|17->5|17->5|18->6|18->6|18->6|20->8|22->1|24->9|26->11|26->11|28->13|28->13|28->13|28->13|28->13|31->16|31->16|31->16|33->18|33->18|33->18|35->20|35->20|35->20|37->22|37->22|39->24|41->26|41->26|41->26|44->29|44->29|46->31|49->34|49->34|49->34|53->38|53->38|56->41|56->41|56->41|56->41|59->44|59->44|59->44|61->46|61->46|61->46|66->51|66->51|69->54|73->58
                    -- GENERATED --
                */
            
