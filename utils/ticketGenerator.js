const PDFDocument = require('pdfkit');

/**
 * Generates an elegant, designer PDF ticket in memory as a Buffer.
 * Matches the client-side ticket design with vector-drawn elements for stability.
 * 
 * @param {Object} ticketDetails
 * @returns {Promise<Buffer>}
 */
const generateTicketPDFBuffer = async (ticketDetails) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a document with custom card size: 500x750 pt
      const doc = new PDFDocument({ size: [500, 750], margin: 0 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', (err) => {
        reject(err);
      });

      const {
        ticketId,
        ticketType,
        price,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        buyerName,
        buyerEmail,
        category,
        poster
      } = ticketDetails;

      const cleanTicketId = ticketId ? ticketId.toString() : 'unknown';
      const ticketNumber = `ES-nd${cleanTicketId.slice(-8).toUpperCase()}`;

      // Save graphics state for clipping
      doc.save();

      // Clip to card boundaries with rounded corners (matches border-radius: 16px)
      doc.roundedRect(15, 15, 470, 720, 16).clip();

      // Fill background
      doc.rect(15, 15, 470, 720).fillColor('#ffffff').fill();

      // Top Accent Bar (Gradient from #FF2A5F to #8b5cf6)
      const accentGrad = doc.linearGradient(15, 15, 485, 15);
      accentGrad.stop(0, '#FF2A5F');
      accentGrad.stop(1, '#8b5cf6');
      doc.rect(15, 15, 470, 12).fill(accentGrad);

      // Logo: Vector ticket icon
      doc.save();
      doc.translate(35, 50);
      doc.fillColor('#8b5cf6');
      doc.moveTo(0, 2)
         .lineTo(16, 2)
         .quadraticCurveTo(16, 6, 20, 6)
         .quadraticCurveTo(24, 6, 24, 2)
         .lineTo(30, 2)
         .lineTo(30, 18)
         .lineTo(24, 18)
         .quadraticCurveTo(24, 14, 20, 14)
         .quadraticCurveTo(16, 14, 16, 18)
         .lineTo(0, 18)
         .closePath()
         .fill();
      doc.restore();

      // Logo Text "EVENTSPHERE"
      doc.fillColor('#8b5cf6')
         .font('Helvetica-Bold')
         .fontSize(16)
         .text('EVENTSPHERE', 75, 52, { lineGap: 0 });

      // Ticket Number Header
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(7.5)
         .text('TICKET NUMBER', 350, 48, { width: 115, align: 'right' });

      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text(ticketNumber, 350, 60, { width: 115, align: 'right' });

      // First Dashed Divider
      doc.moveTo(35, 95)
         .lineTo(465, 95)
         .lineWidth(1.2)
         .strokeColor('#e2e8f0')
         .dash(4, { space: 4 })
         .stroke()
         .undash();

      // Poster Image / Fallback Placeholder Card
      let imageBuffer = null;
      if (poster) {
        if (poster.startsWith('data:image')) {
          const matches = poster.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            imageBuffer = Buffer.from(matches[2], 'base64');
          }
        } else if (poster.startsWith('http://') || poster.startsWith('https://')) {
          try {
            const response = await fetch(poster, { signal: AbortSignal.timeout(5000) });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
            }
          } catch (err) {
            console.warn('⚠️ PDF Ticket Generator: Failed to fetch remote poster image:', err.message);
          }
        } else {
          // Check for local file path
          const path = require('path');
          const fs = require('fs');
          const localPath = path.resolve(poster.startsWith('/') ? poster.slice(1) : poster);
          if (fs.existsSync(localPath)) {
            try {
              imageBuffer = fs.readFileSync(localPath);
            } catch (err) {
              console.warn('⚠️ PDF Ticket Generator: Failed to read local poster file:', err.message);
            }
          }
        }
      }

      if (imageBuffer) {
        try {
          doc.save();
          // Draw poster clipped to rounded card
          doc.roundedRect(35, 115, 120, 160, 10).clip();
          doc.image(imageBuffer, 35, 115, { width: 120, height: 160 });
          doc.restore();

          // Stroke border around poster
          doc.roundedRect(35, 115, 120, 160, 10)
             .lineWidth(1)
             .strokeColor('#e2e8f0')
             .stroke();
        } catch (err) {
          console.warn('⚠️ PDF Ticket Generator: Failed to embed image buffer in PDFKit:', err.message);
          imageBuffer = null;
        }
      }

      if (!imageBuffer) {
        // Fallback Vector Placeholder
        doc.save();
        const placeholderGrad = doc.linearGradient(35, 115, 155, 275);
        placeholderGrad.stop(0, '#7c3aed');
        placeholderGrad.stop(1, '#a855f7');
        doc.roundedRect(35, 115, 120, 160, 10).fill(placeholderGrad);

        // Center ticket logo inside the placeholder
        doc.translate(35 + 60 - 20, 115 + 80 - 15);
        doc.fillColor('#ffffff');
        doc.moveTo(0, 3)
           .lineTo(20, 3)
           .quadraticCurveTo(20, 8, 25, 8)
           .quadraticCurveTo(30, 8, 30, 3)
           .lineTo(40, 3)
           .lineTo(40, 27)
           .lineTo(30, 27)
           .quadraticCurveTo(30, 22, 25, 22)
           .quadraticCurveTo(20, 22, 20, 27)
           .lineTo(0, 27)
           .closePath()
           .fill();
        doc.restore();
      }

      // Event details (Right column)
      // Category tag badge
      const cleanCategory = (category || 'Event').toUpperCase();
      doc.save();
      doc.roundedRect(175, 115, 80, 18, 9)
         .fillColor('#f3e8ff')
         .fill();
      doc.fillColor('#8b5cf6')
         .font('Helvetica-Bold')
         .fontSize(8)
         .text(cleanCategory, 175, 120, { width: 80, align: 'center' });
      doc.restore();

      // Title
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(15)
         .text(eventTitle, 175, 142, { width: 290, lineGap: 3 });

      // Determine height of title to adjust details grid dynamically
      const titleHeight = doc.heightOfString(eventTitle, { width: 290, lineGap: 3 });
      const gridY = Math.max(200, 142 + titleHeight + 10);

      // Date field
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(7.5)
         .text('DATE', 175, gridY);
      
      const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      }) : 'TBA';
      doc.fillColor('#1e293b')
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text(formattedDate, 175, gridY + 11);

      // Time field
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(7.5)
         .text('TIME', 320, gridY);

      doc.fillColor('#1e293b')
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text(eventTime || 'TBA', 320, gridY + 11);

      // Venue field
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(7.5)
         .text('VENUE', 175, gridY + 36);

      doc.fillColor('#1e293b')
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text(eventLocation || 'TBA', 175, gridY + 47, { width: 290, lineGap: 1.5 });

      // Second Dashed Divider
      doc.moveTo(35, 305)
         .lineTo(465, 305)
         .lineWidth(1.2)
         .strokeColor('#e2e8f0')
         .dash(4, { space: 4 })
         .stroke()
         .undash();

      // Info Box (Attendee, Ticket Type, Price)
      const infoBoxY = 325;
      doc.roundedRect(35, infoBoxY, 430, 90, 10)
         .fillColor('#f8fafc')
         .fill();
      doc.roundedRect(35, infoBoxY, 430, 90, 10)
         .lineWidth(1)
         .strokeColor('#e2e8f0')
         .stroke();

      // Column 1: Attendee details
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(7.5)
         .text('ATTENDEE', 55, infoBoxY + 16);
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text(buyerName, 55, infoBoxY + 28, { width: 170, ellipsis: true });
      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(8.5)
         .text(buyerEmail, 55, infoBoxY + 42, { width: 170, ellipsis: true });

      // Column 2: Ticket Type
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(7.5)
         .text('TICKET TYPE', 245, infoBoxY + 16);
      doc.fillColor('#8b5cf6')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(ticketType || 'Standard', 245, infoBoxY + 28, { width: 110, ellipsis: true });

      // Column 3: Price
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(7.5)
         .text('PRICE', 375, infoBoxY + 16);
      
      const priceVal = Number(price);
      const priceText = (isNaN(priceVal) || priceVal === 0) ? 'FREE' : `Rs. ${priceVal}`;
      doc.fillColor('#10b981')
         .font('Helvetica-Bold')
         .fontSize(10.5)
         .text(priceText, 375, infoBoxY + 28, { width: 80, ellipsis: true });

      // Barcode Area
      const barcodeWidth = 280;
      const barcodeHeight = 42;
      const barcodeX = (500 - barcodeWidth) / 2;
      const barcodeY = 445;

      doc.save();
      // Draw simulated barcode stripes
      for (let idx = 0; idx < 45; idx++) {
        const widths = [1.2, 2.2, 3.2, 4.2];
        const w = widths[(idx * 7 + 13) % widths.length];
        const margin = (idx * 3) % 2 === 0 ? 1.5 : 3;
        doc.rect(barcodeX + (idx * 6.2), barcodeY, w, barcodeHeight)
           .fillColor('#0f172a')
           .fill();
      }
      doc.restore();

      // Ticket ID text below barcode
      doc.fillColor('#64748b')
         .font('Helvetica-Bold')
         .fontSize(8.5)
         .text(`*${cleanTicketId.toUpperCase()}*`, 35, barcodeY + barcodeHeight + 10, { width: 430, align: 'center', characterSpacing: 4 });

      // Bottom Notice
      doc.fillColor('#94a3b8')
         .font('Helvetica')
         .fontSize(8)
         .text(`This is an official ticket for ${eventTitle}. Please present either a printed copy or show the PDF on your mobile device at entry.`, 50, 650, { width: 400, align: 'center', lineGap: 3 });

      // Restore graphics state to release clip
      doc.restore();

      // Card border stroke (drawn outside clipping to ensure clean rendering)
      doc.roundedRect(15, 15, 470, 720, 16)
         .lineWidth(1.5)
         .strokeColor('#e2e8f0')
         .stroke();

      // Finalize the PDF document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateTicketPDFBuffer };
