/*!
* Start Bootstrap - Grayscale v7.0.6 (https://startbootstrap.com/theme/grayscale)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-grayscale/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }

    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // Copy-to-Clipboard Functionality
    const copyTextTrigger = document.getElementById('copyText');
    if (copyTextTrigger) {
        // Initialize Bootstrap tooltip
        const tooltip = new bootstrap.Tooltip(copyTextTrigger, { trigger: 'manual' });

        // Add click event listener
        copyTextTrigger.addEventListener('click', function () {
            const textToCopy = copyTextTrigger.innerText;

            // Copy text to clipboard
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Show tooltip
                tooltip.show();

                // Hide tooltip after 1.5 seconds
                setTimeout(() => tooltip.hide(), 1500);
            }).catch(error => {
                console.error('Error copying text: ', error);
            });
        });
    }

});

// Open location in a new window
const locationTrigger = document.getElementById('openLocation');
if (locationTrigger) {
    locationTrigger.addEventListener('click', () => {
        const mapsUrl = 'https://www.google.com/maps/place/%D0%9F%D0%9F%D0%9C%D0%93+%E2%80%9E%D0%90%D0%BA%D0%B0%D0%B4.+%D0%98%D0%B2%D0%B0%D0%BD+%D0%A6%D0%B5%D0%BD%D0%BE%D0%B2%E2%80%9C/@43.2044898,23.5573439,3a,75y,9.16h,128.24t/data=!3m8!1e1!3m6!1sAF1QipOvjNJCo1AOZs6efdr1Imtk-gj7kRmU2jZXmg_N!2e10!3e11!6shttps:%2F%2Flh5.googleusercontent.com%2Fp%2FAF1QipOvjNJCo1AOZs6efdr1Imtk-gj7kRmU2jZXmg_N%3Dw900-h600-k-no-pi-38.235967541293206-ya1.2752473763226098-ro0-fo100!7i9000!8i4500!4m19!1m9!3m8!1s0x40ab191fa1b62191:0xff6ee062d94d6b9f!2z0J_Qn9Cc0JMg4oCe0JDQutCw0LQuINCY0LLQsNC9INCm0LXQvdC-0LLigJw!8m2!3d43.2049509!4d23.5567991!9m1!1b1!16s%2Fg%2F1tf8rlqw!3m8!1s0x40ab191fa1b62191:0xff6ee062d94d6b9f!8m2!3d43.2049509!4d23.5567991!10e5!14m1!1BCgIgARICCAI!16s%2Fg%2F1tf8rlqw?entry=ttu&g_ep=EgoyMDI0MTEyNC4xIKXMDSoASAFQAw%3D%3D';
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    });
}

// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const adminRoutes = require('./routes/admin');
const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ppmg_erasmus', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use(adminRoutes);

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
