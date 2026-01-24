/**
 * StreetFoodFinder Calendar Scraper for YoYo Bubble Tea
 *
 * Instructions:
 * 1. Open https://streetfoodfinder.com/yoyobubbleteaco?tab=calendar in your browser
 * 2. Wait for the calendar to fully load
 * 3. Open Developer Tools (F12 or Cmd+Option+I on Mac)
 * 4. Go to the Console tab
 * 5. Paste this entire script and press Enter
 * 6. Copy the JSON output
 * 7. Update src/components/ScheduleSection.vue with the new data
 */

(function scrapeStreetFoodFinderCalendar() {
  'use strict';

  const results = [];
  let id = 1;

  // StreetFoodFinder structure:
  // - Each event is in .block-list
  // - Date is in .block-date (day abbrev, date number in .txt-lg, month abbrev)
  // - Event details are in div with lt/ln/ad/tx attributes
  // - Location name in .txt-mdl.txt-sb
  // - Address in .txt-md after pin icon
  // - Time in small.txt-gray

  const blockLists = document.querySelectorAll('.block-list');

  blockLists.forEach((block) => {
    try {
      // Get date parts from .block-date
      const dateBlock = block.querySelector('.block-date');
      const dayAbbrev = dateBlock?.childNodes[0]?.textContent?.trim() ||
                        dateBlock?.querySelector('.sticky')?.childNodes[0]?.textContent?.trim() || '';
      const dateNum = dateBlock?.querySelector('.txt-lg')?.textContent?.trim() || '';
      const monthAbbrev = dateBlock?.querySelector('.sticky')?.childNodes[4]?.textContent?.trim() || '';

      // Map day abbreviations to full names
      const dayMap = {
        'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
        'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
      };

      // Get event details from the element with lt/ln attributes
      const eventEl = block.querySelector('[lt][ln]');
      if (!eventEl) return;

      const lat = parseFloat(eventEl.getAttribute('lt')) || 0;
      const lng = parseFloat(eventEl.getAttribute('ln')) || 0;
      const fullAddress = decodeURIComponent(eventEl.getAttribute('ad') || '');

      // Get location name
      const locationName = eventEl.querySelector('.txt-mdl.txt-sb')?.textContent?.trim() ||
                          eventEl.querySelector('.txt-sb')?.textContent?.trim() || '';

      // Get short address
      const shortAddress = eventEl.querySelector('.txt-md')?.textContent?.trim() || fullAddress;

      // Get time
      const timeEl = eventEl.querySelector('small.txt-gray') || eventEl.querySelector('small');
      let time = timeEl?.textContent?.trim() || '';

      // Convert "11:00 AM to 3:00 PM" to "11am - 3pm" format
      time = time.replace(/(\d+):00\s*(AM|PM)\s*to\s*(\d+):00\s*(AM|PM)/i, (_, h1, p1, h2, p2) => {
        return `${h1}${p1.toLowerCase()} - ${h2}${p2.toLowerCase()}`;
      });

      results.push({
        id: id++,
        day: dayMap[dayAbbrev] || dayAbbrev,
        date: `${monthAbbrev} ${dateNum}`,
        location: locationName,
        address: shortAddress || fullAddress,
        time: time,
        lat: lat,
        lng: lng
      });
    } catch (e) {
      console.warn('Error parsing event:', e);
    }
  });

  if (results.length > 0) {
    console.log('\n========== SCRAPED SCHEDULE DATA ==========\n');

    // Output as TypeScript array format for easy copy-paste
    console.log('const schedule: ScheduleLocation[] = [');
    results.forEach((r, i) => {
      const comma = i < results.length - 1 ? ',' : '';
      console.log(`  { id: ${r.id}, day: '${r.day}', date: '${r.date}', location: '${r.location}', address: '${r.address}', time: '${r.time}', lat: ${r.lat}, lng: ${r.lng} }${comma}`);
    });
    console.log(']');

    console.log('\n========== JSON FORMAT ==========\n');
    console.log(JSON.stringify(results, null, 2));

    console.log('\n============================================');
    console.log(`Found ${results.length} schedule entries.`);
  } else {
    console.log('No events found. Make sure the calendar tab is loaded.');
  }

  return results;
})();
