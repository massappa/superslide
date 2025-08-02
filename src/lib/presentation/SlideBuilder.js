const path = require("path");
// Note: __dirname is not available in all environments. Using process.cwd() for a more reliable path from the project root.
const LOGO_PATH = path.join(process.cwd(), "public", "Anqa-IT Security GmbH.jpg");
const BORDER_COLOR = "#0000ff";
const BORDER_IN_COLOR = "#0000ff";
const rechtangelBorder_Color = "#b60c26";
const SLIDE_BACKGROUND = "#141414";
const TEXT_COLOR = "#FFFFFF";
const ArtikelText = "xxx";
const BottomFotterText = "Anqa IT Security GmbH";
const AnqaAddress = "anqa-itsecurity.de";

class SlideBuilder {
    constructor(pptx) {
      this.pptx = pptx;
    }
    createSlide() {
      const slide = this.pptx.addSlide();
      slide.background = { fill: SLIDE_BACKGROUND };
      return slide;
    }
    addText(slide, text, options) {
      slide.addText(text, { ...options, color: TEXT_COLOR });
    }
    addLogo(slide, x = 9.0, y = 0.1, w = 0.8, h = 0.5) {
      // Add a check for logo existence if needed
      slide.addImage({ path: LOGO_PATH, x, y, w, h });
    }
    addRoundBorder(slide, borderColor = BORDER_COLOR) {
      slide.addShape(this.pptx.ShapeType.line, {
        x: 0,
        y: 0,
        w: "100%",
        h: 0,
        line: { color: borderColor, width: 2 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 0,
        y: "100%",
        w: "100%",
        h: 0,
        line: { color: borderColor, width: 2 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 0,
        y: 0,
        w: 0,
        h: "100%",
        line: { color: borderColor, width: 2 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: "100%",
        y: 0,
        w: 0,
        h: "100%",
        line: { color: borderColor, width: 2 },
      });
    }
    addInBorder(slide, borderColor = BORDER_COLOR) {
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1,
        y: 5.3,
        w: 8.0,
        h: 0,
        line: { color: BORDER_IN_COLOR, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1,
        y: 0.7,
        w: 8.0,
        h: 0,
        line: { color: BORDER_IN_COLOR, width: 0.5 },
      });
    }
    thirteenthSlideTabell(slide) {
      const data = [
        { abteilung: "IT", downloads: "150", klicks: "75" },
        { abteilung: "Marketing", downloads: "300", klicks: "150" },
        { abteilung: "Sales", downloads: "200", klicks: "100" },
      ];
      // Table Cell designs
      const TableCellFormating = {
        color: "000000",
        fill: "#cccccc",
        align: "center",
        valign: "middle",
        border: {
          pt: 1,
          color: "000000",
        },
      };
      let rows = [
        [
          {
            text: "Abteilung",
            options: {
              color: "FFFFFF",
              bold: true,
              fill: "#0000ff",
              align: "center",
              valign: "middle",
              border: { pt: 1, color: "000000" },
            },
          },
          {
            text: "Downloads",
            options: {
              color: "FFFFFF",
              bold: true,
              fill: "#0000ff",
              align: "center",
              valign: "middle",
              border: { pt: 1, color: "000000" },
            },
          },
          {
            text: "Klicks",
            options: {
              color: "FFFFFF",
              bold: true,
              fill: "#0000ff",
              align: "center",
              valign: "middle",
              border: { pt: 1, color: "000000" },
            },
          },
        ],
      ];
      let totalDownloads = 0;
      let totalKlicks = 0;
      // Function to transform data
      data.forEach((record) => {
        let row = [];
        Object.values(record).forEach((value) => {
          row.push({ text: value, options: { ...TableCellFormating } });
        });
        rows.push(row);
        totalDownloads += parseInt(record.downloads, 10); // Ensures the string is interpreted as a decimal number.
        totalKlicks += parseInt(record.klicks, 10);
      });
      // Add the total row
      rows.push([
        {
          text: "Total",
          options: {
            color: "FFFFFF",
            bold: true,
            fill: "#0000ff",
            align: "center",
            valign: "middle",
            border: { pt: 1, color: "000000" },
          },
        },
        {
          text: totalDownloads.toString(),
          options: {
            color: "000000",
            fill: "#cccccc",
            align: "center",
            valign: "middle",
            border: { pt: 1, color: "000000" },
          },
        },
        {
          text: totalKlicks.toString(),
          options: {
            color: "000000",
            fill: "#cccccc",
            align: "center",
            valign: "middle",
            border: { pt: 1, color: "000000" },
          },
        },
      ]);
      // Define table options
      let tableOptions = {
        x: 1.0, // X position of the table
        y: 1.8, // Y position of the table
        w: 4.5, // Total width of the table
        colW: [2.2, 1.8, 1.8], // Column widths
        rowH: 0.1, // Row height
        fontFace: "Arial",
        fontSize: 11,
      };
      // Add the table to the slide
      slide.addTable(rows, tableOptions);
    }
    seventhSlideRechtangelBorder(slide, borderColor = rechtangelBorder_Color) {
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1.5,
        y: 2.7,
        w: 6.7,
        h: 0,
        line: { color: borderColor, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1.5,
        y: 3.4,
        w: 6.7,
        h: 0,
        line: { color: borderColor, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1.5,
        y: 2.7,
        w: 0,
        h: 0.7,
        line: { color: borderColor, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 8.2,
        y: 2.7,
        w: 0,
        h: 0.7,
        line: { color: borderColor, width: 0.5 },
      });
    }
    sixtenthSlideRechtangelBorder(slide) {
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1.5,
        y: 3.4,
        w: 6.9,
        h: 0,
        line: { color: rechtangelBorder_Color, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1.5,
        y: 3.0,
        w: 6.9,
        h: 0,
        line: { color: rechtangelBorder_Color, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1.5,
        y: 3.0,
        w: 0,
        h: 0.4,
        line: { color: rechtangelBorder_Color, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 8.4,
        y: 3.0,
        w: 0,
        h: 0.4,
        line: { color: rechtangelBorder_Color, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1.5,
        y: 4.3,
        w: 7.4,
        h: 0,
        line: { color: rechtangelBorder_Color, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1.5,
        y: 5.0,
        w: 7.4,
        h: 0,
        line: { color: rechtangelBorder_Color, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 1.5,
        y: 4.3,
        w: 0,
        h: 0.7,
        line: { color: rechtangelBorder_Color, width: 0.5 },
      });
      slide.addShape(this.pptx.ShapeType.line, {
        x: 8.9,
        y: 4.3,
        w: 0,
        h: 0.7,
        line: { color: rechtangelBorder_Color, width: 0.5 },
      });
    }
    addWebsiteAddress(slide) {
      this.addText(slide, AnqaAddress, {
        x: 0.1,
        y: 5.5,
        fontSize: 8,
        color: TEXT_COLOR,
      });
    }
    addStandardText(slide) {
      this.addText(slide, ArtikelText, {
        x: 3.0,
        y: 0.5,
        fontSize: 18,
        color: TEXT_COLOR,
        bold: true,
      });
      this.addText(slide, BottomFotterText, {
        x: 1.7,
        y: 5.4,
        fontSize: 8,
        color: TEXT_COLOR,
      });
    }
  }
  
  module.exports = { SlideBuilder };
  