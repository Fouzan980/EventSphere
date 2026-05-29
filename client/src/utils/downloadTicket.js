export const downloadTicketPDF = (ticketDetails) => {
  return new Promise((resolve, reject) => {
    // Check if html2pdf is already loaded
    if (window.html2pdf) {
      generate(window.html2pdf);
    } else {
      // Load from CDN dynamically
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => generate(window.html2pdf);
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    }

    function generate(html2pdf) {
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

      const cleanTicketId = ticketId || 'unknown';
      const ticketNumber = `ES-nd${cleanTicketId.slice(-8).toUpperCase()}`;

      // Create a temporary container for the ticket HTML
      const element = document.createElement('div');
      element.style.padding = '10px';
      element.style.margin = '0';
      element.style.fontFamily = "'Inter', 'Segoe UI', Roboto, sans-serif";
      element.style.color = '#1e293b';
      element.style.background = '#ffffff';
      element.style.width = '170mm'; // fits well within A4 (210mm)
      element.style.boxSizing = 'border-box';

      // Elegant Modern Ticket Design
      element.innerHTML = `
        <div style="
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        ">
          <!-- Top Accent Bar -->
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 10px;
            background: linear-gradient(90deg, #FF2A5F, #8b5cf6);
          "></div>

          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 18px; margin-top: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 28px;">🎟️</span>
              <span style="font-size: 1.4rem; font-weight: 900; letter-spacing: 1px; color: #8b5cf6;">EVENTSPHERE</span>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; margin-bottom: 4px;">Ticket Number</div>
              <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">${ticketNumber}</div>
            </div>
          </div>

          <!-- Ticket Content Body -->
          <div style="display: flex; gap: 24px; margin-bottom: 24px;">
            <!-- Left Side: Poster (if exists) -->
            ${poster ? `
              <div style="flex: 0 0 130px; height: 170px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; background: #f1f5f9;">
                <img src="${poster}" style="width: 100%; height: 100%; object-fit: cover;" alt="Poster" />
              </div>
            ` : `
              <div style="flex: 0 0 130px; height: 170px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; background: linear-gradient(135deg, #7c3aed, #a855f7); display: flex; align-items: center; justify-content: center; color: #ffffff;">
                <span style="font-size: 40px;">🎪</span>
              </div>
            `}

            <!-- Right Side: Event details -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding-top: 4px; padding-bottom: 4px;">
              <div>
                <span style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; display: inline-block; margin-bottom: 8px;">
                  ${category || 'General Event'}
                </span>
                <h1 style="font-size: 1.55rem; font-weight: 800; color: #0f172a; margin: 0 0 12px; line-height: 1.25; letter-spacing: -0.3px;">
                  ${eventTitle}
                </h1>
              </div>

              <!-- Main info points -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div>
                  <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 2px;">Date</div>
                  <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b;">${eventDate ? new Date(eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}</div>
                </div>
                <div>
                  <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 2px;">Time</div>
                  <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b;">${eventTime || 'TBA'}</div>
                </div>
                <div style="grid-column: span 2;">
                  <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 2px;">Venue</div>
                  <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; line-height: 1.3;">${eventLocation || 'TBA'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div style="border-top: 2px dashed #e2e8f0; margin-bottom: 24px; position: relative;">
            <div style="position: absolute; left: -39px; top: -10px; width: 20px; height: 20px; background: #ffffff; border-radius: 50%; border: 2px solid #e2e8f0; border-left-color: transparent; border-top-color: transparent; transform: rotate(-45deg);"></div>
            <div style="position: absolute; right: -39px; top: -10px; width: 20px; height: 20px; background: #ffffff; border-radius: 50%; border: 2px solid #e2e8f0; border-right-color: transparent; border-top-color: transparent; transform: rotate(45deg);"></div>
          </div>

          <!-- Attendee & Ticket Tier Info -->
          <div style="display: grid; grid-template-columns: 1.2fr 0.9fr 0.9fr; gap: 16px; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #f1f5f9;">
            <div>
              <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Attendee</div>
              <div style="font-size: 0.92rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">${buyerName}</div>
              <div style="font-size: 0.78rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${buyerEmail}</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Ticket Type</div>
              <div style="font-size: 0.92rem; font-weight: 700; color: #8b5cf6;">${ticketType || 'Standard'}</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Price</div>
              <div style="font-size: 0.92rem; font-weight: 800; color: #10b981;">${price === 0 || price === '0' ? 'FREE' : `Rs. ${price}`}</div>
            </div>
          </div>

          <!-- Barcode Area -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 12px; margin-bottom: 12px;">
            <!-- Simulated Barcode -->
            <div style="display: flex; height: 42px; width: 280px; align-items: flex-start; justify-content: center; background: #ffffff;">
              ${Array.from({ length: 36 }).map((_, idx) => {
                const widths = [1, 2, 3, 4];
                const w = widths[(idx * 7 + 13) % widths.length];
                const margin = (idx * 3) % 2 === 0 ? '1px' : '2px';
                return `<div style="width: ${w}px; height: 100%; background: #0f172a; margin-right: ${margin};"></div>`;
              }).join('')}
            </div>
            <div style="font-size: 0.75rem; color: #64748b; letter-spacing: 6px; font-weight: 600; text-transform: uppercase; margin-top: 4px;">
              *${cleanTicketId.toUpperCase()}*
            </div>
          </div>

          <!-- Bottom Notice -->
          <div style="text-align: center; margin-top: 20px; font-size: 0.72rem; color: #94a3b8; line-height: 1.4; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            This is an official ticket for <strong>${eventTitle}</strong>. Please present either a printed copy or show the PDF on your mobile device at entry.
          </div>
        </div>
      `;

      // Options for html2pdf
      const opt = {
        margin:       10,
        filename:     `EventSphere-Ticket-${ticketNumber}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate the PDF
      html2pdf().set(opt).from(element).save().then(() => {
        resolve();
      }).catch(err => {
        console.error('PDF generation error', err);
        reject(err);
      });
    }
  });
};
