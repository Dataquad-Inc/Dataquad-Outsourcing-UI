import React, { useState } from "react";
import { IconButton, Menu, MenuItem, LinearProgress, Tooltip } from "@mui/material";
import { Download } from "@mui/icons-material";
import ToastService from "../Services/toastService";
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const DownloadResume = ({ candidate, getDownloadUrl }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const downloadFile = async (url, format) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': format === 'pdf' 
            ? 'application/pdf' 
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${candidate.candidateFullName?.replace(/\s+/g, '_') || 'resume'}_resume.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      return {
        blob: await response.blob(),
        filename
      };
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  };

  const rgbToHex = (r, g, b) => {
    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const extractAdvancedTextContent = async (pdf) => {
    const pages = [];
    const links = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Sort text items by position
      const sortedItems = textContent.items
        .map(item => ({
          text: item.str,
          x: item.transform[4],
          y: viewport.height - item.transform[5],
          width: item.width,
          height: item.height,
          fontSize: item.height || 11,
          bold: item.fontName?.includes('Bold') || false,
          italic: item.fontName?.includes('Italic') || false,
          color: item.color && item.color.length === 3 ? 
            rgbToHex(item.color[0], item.color[1], item.color[2]) : '#000000'
        }))
        .filter(item => item.text.trim().length > 0)
        .sort((a, b) => {
          const yThreshold = 5;
          if (Math.abs(a.y - b.y) < yThreshold) return a.x - b.x;
          return a.y - b.y;
        });

      // Extract links
      try {
        const annotations = await page.getAnnotations();
        annotations.forEach(annotation => {
          if (annotation.url) {
            links.push({
              url: annotation.url,
              text: annotation.url
            });
          }
        });
      } catch (e) {
        console.warn('Could not extract annotations');
      }
      
      pages.push({
        items: sortedItems,
        width: viewport.width
      });
      
      setConversionProgress((i / pdf.numPages) * 40);
    }
    
    return { pages, links };
  };

  const groupTextIntoLines = (items) => {
    if (!items.length) return [];
    
    const lines = [];
    let currentLine = [items[0]];
    
    for (let i = 1; i < items.length; i++) {
      const current = items[i];
      const previous = items[i - 1];
      
      const yThreshold = Math.max(current.fontSize, previous.fontSize) * 0.3;
      const xGap = current.x - (previous.x + previous.width);
      
      if (Math.abs(current.y - previous.y) <= yThreshold) {
        if (xGap < 50) {
          currentLine.push(current);
        } else {
          lines.push(currentLine);
          currentLine = [current];
        }
      } else {
        lines.push(currentLine);
        currentLine = [current];
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const identifyTextStyle = (items) => {
    if (!items.length) return { type: 'normal', size: 22 };
    
    const avgFontSize = items.reduce((sum, item) => sum + item.fontSize, 0) / items.length;
    const hasBold = items.some(item => item.bold);
    const hasItalic = items.some(item => item.italic);
    const text = items.map(item => item.text).join('').trim();
    const color = items[0].color;

    if (avgFontSize > 14 || hasBold) {
      if (text.toUpperCase() === text && text.length < 50) {
        return { 
          type: 'heading1', 
          size: Math.round(avgFontSize * 2), 
          bold: true,
          color: color || '2E74B5',
          alignment: AlignmentType.CENTER
        };
      } else if (hasBold && text.length < 100) {
        return { 
          type: 'heading2', 
          size: Math.round(avgFontSize * 2), 
          bold: true,
          color: color || '1F4E79',
          alignment: AlignmentType.LEFT
        };
      }
    }
    
    if (text.match(/^[•·\-\*]\s/) || text.match(/^\d+\.\s/)) {
      return { 
        type: 'bullet', 
        size: Math.round(avgFontSize * 2), 
        bold: hasBold, 
        italic: hasItalic,
        color: color || '000000',
        alignment: AlignmentType.LEFT
      };
    }
    
    return { 
      type: 'normal', 
      size: Math.round(avgFontSize * 2), 
      bold: hasBold, 
      italic: hasItalic,
      color: color || '000000',
      alignment: AlignmentType.LEFT
    };
  };

  const createWordDocument = (pages, links) => {
    const children = [];
    
    pages.forEach((page) => {
      const lines = groupTextIntoLines(page.items);
      
      lines.forEach((line) => {
        const text = line.map(item => item.text).join('').trim();
        if (!text) return;
        
        const style = identifyTextStyle(line);
        
        const paragraphOptions = {
          children: [new TextRun({
            text: text,
            size: style.size,
            bold: style.bold,
            italic: style.italic,
            color: style.color,
            font: "Calibri"
          })],
          spacing: {
            before: style.type === 'heading1' ? 400 : style.type === 'heading2' ? 300 : 120,
            after: style.type === 'heading1' ? 200 : style.type === 'heading2' ? 150 : 120,
            line: 276
          },
          alignment: style.alignment
        };
        
        if (style.type === 'heading1') {
          paragraphOptions.heading = HeadingLevel.HEADING_1;
        } else if (style.type === 'heading2') {
          paragraphOptions.heading = HeadingLevel.HEADING_2;
        } else if (style.type === 'bullet') {
          paragraphOptions.bullet = { level: 0 };
        }
        
        children.push(new Paragraph(paragraphOptions));
      });
    });
    
    if (links.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ 
          text: "Links:", 
          bold: true, 
          size: 28,
          color: "2E74B5"
        })],
        spacing: { before: 400, after: 200 },
        heading: HeadingLevel.HEADING_2
      }));
      
      links.forEach(link => {
        children.push(new Paragraph({
          children: [
            new ExternalHyperlink({
              children: [new TextRun({
                text: link.text,
                size: 22,
                color: "0563C1",
                underline: {}
              })],
              link: link.url
            })
          ],
          spacing: { after: 100 }
        }));
      });
    }
    
    return new Document({
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: {
              size: 22,
              color: "000000",
              font: "Calibri"
            },
            paragraph: {
              spacing: { line: 276, before: 120, after: 120 }
            }
          }
        ]
      },
      sections: [{
        children,
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        }
      }]
    });
  };

  const convertPdfToWord = async (pdfBlob) => {
    setIsConverting(true);
    setConversionProgress(0);
    
    try {
      const pdfData = await pdfBlob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

      const { pages, links } = await extractAdvancedTextContent(pdf);
      setConversionProgress(50);

      const doc = createWordDocument(pages, links);
      setConversionProgress(95);

      const blob = await Packer.toBlob(doc);
      setConversionProgress(100);
      return blob;
    } catch (error) {
      console.error('Conversion failed:', error);
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async (format, event) => {
    if (event) event.stopPropagation();
    
    if (!candidate?.candidateId || !candidate?.jobId) {
      ToastService.error("Missing candidate information");
      handleClose();
      return;
    }

    try {
      const originalFormat = format === 'word' ? 'pdf' : format;
      const url = getDownloadUrl(candidate, originalFormat);
      
      ToastService.info("Preparing download...");
      const { blob, filename: originalFilename } = await downloadFile(url, originalFormat);

      let downloadBlob, filename;

      if (format === 'word') {
        ToastService.info("Converting to Word...");
        downloadBlob = await convertPdfToWord(blob);
        filename = originalFilename?.replace(/\.pdf$/i, '.docx') || 
                  `${candidate.candidateFullName?.replace(/\s+/g, '_') || 'resume'}.docx`;
      } else {
        downloadBlob = blob;
        filename = originalFilename || 
                 `${candidate.candidateFullName?.replace(/\s+/g, '_') || 'resume'}.${format}`;
      }

      const link = document.createElement('a');
      link.href = URL.createObjectURL(downloadBlob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 100);

      ToastService.success("Download completed");
    } catch (error) {
      console.error('Download failed:', error);
      ToastService.error(
        error.message.includes('password') ? "Cannot convert password-protected PDF" :
        "Download failed. Please try again"
      );
    } finally {
      handleClose();
    }
  };

  return (
    <>
      <Tooltip title="Download Resume">
        <IconButton 
          color="primary" 
          size="small" 
          onClick={handleClick}
          disabled={isConverting}
        >
          <Download fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={(e) => handleDownload("pdf", e)} disabled={isConverting}>
          Download PDF
        </MenuItem>
        <MenuItem onClick={(e) => handleDownload("docx", e)} disabled={isConverting}>
          Download Word
        </MenuItem>
        <MenuItem onClick={(e) => handleDownload("word", e)} disabled={isConverting}>
          {isConverting ? "Converting..." : "Convert to Word"}
        </MenuItem>
        
        {isConverting && (
          <MenuItem disabled>
            <div style={{ width: 200, padding: '8px 16px' }}>
              <LinearProgress 
                variant="determinate"
                value={conversionProgress}
                style={{ marginBottom: 8 }}
              />
              <div style={{ textAlign: 'center', fontSize: 12 }}>
                {Math.round(conversionProgress)}% complete
              </div>
            </div>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default DownloadResume;