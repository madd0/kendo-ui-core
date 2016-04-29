﻿<%@ Page Title="" Language="C#" MasterPageFile="~/Areas/aspx/Views/Shared/Web.Master" Inherits="System.Web.Mvc.ViewPage<dynamic>" %>

<asp:Content ContentPlaceHolderID="HeadContent" runat="server">
    <!-- Load Pako ZLIB library to enable PDF compression -->
    <script src="< %>"Url.Content("~/Scripts/pako.min.js")"></script>
</asp:Content>

<asp:Content ContentPlaceHolderID="MainContent" runat="server">

<div class="box wide">
    <h4>Export diagram view</h4>
    <div class="box-col">
        <button class='export-pdf k-button'>Save as PDF</button>
    </div>
</div>

<script>
    $(".export-pdf").click(function () {
        $("#diagram").getKendoDiagram().saveAsPDF();
    });
</script>

<script>
    function visualTemplate(options) {
        var dataviz = kendo.dataviz;
        var g = new dataviz.diagram.Group();
        var dataItem = options.dataItem;

        g.append(new dataviz.diagram.Rectangle({
            width: 210,
            height: 75,
            stroke: {
                width: 0
            },
            fill: dataItem.ColorScheme
        }));

        /*
            Use the DejaVu Sans font for display and embedding in the PDF file.
            The standard PDF fonts have no support for Unicode characters.
        */
        g.append(new dataviz.diagram.TextBlock({
            text: dataItem.FirstName + " " + dataItem.LastName,
            fontFamily: "DejaVu Sans",
            fontSize: "14px",
            x: 85,
            y: 20,
            color: "#fff"
        }));

        g.append(new dataviz.diagram.TextBlock({
            text: dataItem.Title,
            fontFamily: "DejaVu Sans",
            fontSize: "14px",
            x: 85,
            y: 40,
            color: "#fff"
        }));

        g.append(new dataviz.diagram.Image({
            source: "<%= Url.Content("~/content/dataviz/diagram/people/") %>" + dataItem.Image,
            x: 3,
        y: 3,
        width: 68,
        height: 68
    }));

    return g;
    }
    
    function onDataBound() {
        this.bringIntoView(this.shapes);
    }
</script>
<div class="demo-section k-content wide">
    <%= Html.Kendo().Diagram()
            .Name("diagram")
            .Pdf(pdf => pdf
              .FileName("Kendo UI Diagram Export.pdf")
              .ProxyURL(Url.Action("Pdf_Export_Save", "Diagram"))
            )
            .DataSource(dataSource => dataSource
                .Read(read => read
                    .Action("_OrgChart", "Diagram")
                )
                .Model(m => m.Children("Items"))
            )
            .Editable(false)
            .Layout(l => l.Type(DiagramLayoutType.Layered))
            .ShapeDefaults(sd => sd
                .Visual("visualTemplate")
            )
            .ConnectionDefaults(cd => cd
                .Stroke(s => s
                    .Color("#979797")
                    .Width(2)
                )
            )
            .Events(events => events.DataBound("onDataBound"))
    %>
</div>
</asp:Content>