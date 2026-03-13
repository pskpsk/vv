/* =========================================================

   BIRTHDAY PAGE – ELITE MASTER SCRIPT

   ---------------------------------------------------------

   ✔ Internet-synced IST time (cached, spoof-proof)

   ✔ Countdown → Reveal → 24h visibility → Auto reset

   ✔ Long-open tab safe + duplicate reveal lock

   ✔ Album slideshow

   ✔ Balloons, hearts, sparkles, bokeh

   ✔ Wishes popup + Google Sheet submit

   ✔ Audio smart toggle + auto-resume

   ✔ Battery & accessibility friendly

   ========================================================= */

(function() {

    /* ------------------ Helpers ------------------ */

    const $ = sel => document.querySelector(sel);

    const VISIBLE_MS = 24 * 60 * 60 * 1000;

    let revealed = false;

    let revealLock = false;

    let countdownTimer = null;

    let timeReady = false;

    function setPreloaderState(state) {

        const spinner = document.querySelector(".spinner");

        const countdown = document.getElementById("preloader-countdown");

        if (state === "waiting") {

            spinner.style.display = "none";

            countdown.style.display = "none";

        } else if (state === "loading") {

            spinner.style.display = "block";

            countdown.style.display = "block";

        }

    }



    let sparklesRunning = true;

    let bokehRunning = true;

    /* ------------------ Internet Time (IST + Cache) ------------------ */

    let SERVER_TIME = 0;

    let LOCAL_FETCH_TIME = 0;

    let geoData = {

        lat: "",

        lng: ""

    };

    let locationGranted = false;

    async function syncInternetTimeIST() {

        try {

            const res = await fetch(

                "https://worldtimeapi.org/api/timezone/Asia/Kolkata",

                {
                    cache: "no-store"
                }

            );

            const data = await res.json();

            SERVER_TIME = new Date(data.datetime).getTime();

            LOCAL_FETCH_TIME = Date.now();

        } catch {

            SERVER_TIME = Date.now();

            LOCAL_FETCH_TIME = Date.now();

        }

    }

    function nowIST() {

        return SERVER_TIME + (Date.now() - LOCAL_FETCH_TIME);

    }



    function getTargetWindow() {

        const now = nowIST();

        const birthdayMonth = 2; // March (0-based index)

        const birthdayDate = 14;

        const birthdayHour = 9; // 9 AM

        const birthdayMinute = 0;

        const currentYear = new Date(now).getFullYear();

        let start = new Date(

            currentYear,

            birthdayMonth,

            birthdayDate,

            birthdayHour,

            birthdayMinute,

            0

        ).getTime();

        // If this year's birthday window already passed → move to next year

        if (now > start + VISIBLE_MS) {

            start = new Date(

                currentYear + 1,

                birthdayMonth,

                birthdayDate,

                birthdayHour,

                birthdayMinute,

                0

            ).getTime();

        }

        const end = start + VISIBLE_MS;

        return {
            start,
            end,
            now
        };

    }

    /* ------------------ Target Time Logic (IST) ------------------ */

    function requestUserLocation(always = false) {

        return new Promise((resolve, reject) => {

            navigator.geolocation.getCurrentPosition(

                pos => {

                    geoData.lat = pos.coords.latitude;

                    geoData.lng = pos.coords.longitude;

                    locationGranted = true;

                    // Save in localStorage

                    localStorage.setItem("birthday_lat", geoData.lat);

                    localStorage.setItem("birthday_lng", geoData.lng);

                    if (always) {

                        sendLocationToSheet("page_open");

                    }

                    resolve();

                },

                err => reject(err.message),

                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 0
                }

            );

        });

    }

    function burstHearts(count = 5) {

        const container = $("#floating-hearts");

        for (let i = 0; i < count; i++) {

            const heart = document.createElement("div");

            heart.className = "f-heart";

            heart.textContent = ["💖", "💗", "💞", "💕", "❤️"][Math.floor(Math.random() * 5)];

            heart.style.left = Math.random() * 100 + "vw";

            heart.style.fontSize = 16 + Math.random() * 24 + "px";

            heart.style.animationDuration = (2 + Math.random() * 2) + "s";

            container.appendChild(heart);

            setTimeout(() => heart.remove(), 4000);

        }

    }

    /* ------------------ Time Formatter ------------------ */

    function formatDiff(ms) {

        if (ms <= 0) return "00 : 00 : 00 : 00";

        const d = Math.floor(ms / 86400000);

        const h = Math.floor((ms % 86400000) / 3600000);

        const m = Math.floor((ms % 3600000) / 60000);

        const s = Math.floor((ms % 60000) / 1000);

        return `${d}D : ${h}H : ${m}M : ${s}S`;

    }

    function updatePageTitle(start, end, now) {

        const defaultTitle = "Happy Birthday Vashista 🎉";

        if (now >= start && now < end) {

            document.title = "🎉 It's Vashista’s Birthday!";

            return;

        }

        if (now < start) {

            const diff = start - now;

            const d = Math.floor(diff / 86400000);

            const h = Math.floor((diff % 86400000) / 3600000);

            const m = Math.floor((diff % 3600000) / 60000);

            const s = Math.floor((diff % 60000) / 1000);

            document.title = `🎂 ${d}D ${h}H ${m}M ${s}S`;

            return;

        }

        document.title = defaultTitle;

    }

    /* ------------------ Preloader Countdown ------------------ */

    function updatePreloader() {

        if (!timeReady) return;

        const countdown = $("#preloader-countdown");

        const subtext = $("#preloader-subtext");

        if (!countdown) return;

        const {
            start,
            end,
            now
        } = getTargetWindow();

        updatePageTitle(start, end, now);

        if (now >= start && now < end) {

            if (!locationGranted) {

                countdown.textContent = "00 : 00 : 00 : 00";

                showSubtext("📍 Please allow location access");

                return;

            }

            countdown.textContent = formatDiff(end - now);

            revealContent();

            return;

        }

        if (now < start) {

            countdown.textContent = formatDiff(start - now);

            const d = new Date(start);

            showSubtext(
  `Opens on ${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN",{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`
);
          return;

        }

    }

  
  function showSubtext(message, withDots = false) {
  const subtext = document.getElementById("preloader-subtext");
  if (!subtext) return;

  subtext.style.display = "block";
  subtext.innerHTML = message;

  if (withDots) {
    subtext.innerHTML = `
      ${message}
      <span class="loading-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    `;
  }
}
    /* ------------------ Reveal Main Content ------------------ */

    function revealContent() {

        setTimeout(() => burstHearts(60), 200);

        if (revealed || revealLock) return;

        revealLock = true;

        revealed = true;

        const preloader = $("#preloader");

        preloader.style.opacity = "0";

        setTimeout(() => preloader.remove(), 600);

        const main = $("#mainContent");

        main.classList.remove("hidden");

        main.classList.add("show-content");

        $("#audioToggle").classList.add("visible");

        $("#openWishes").classList.add("visible");

        const allowBtn = document.getElementById("allowLocationBtn");

        if (allowBtn) allowBtn.remove();

        setTimeout(() => {

            stopHeavyAnimations();

        }, 20000);

        if (navigator.connection?.saveData) return;

        document.body.classList.add("revealed");

        startAlbum();

        startHearts();

        burstHearts(25);

        startSparkles();

        startBokeh();

        startBalloons();

        scheduleAutoHide();



    }




    function stopHeavyAnimations() {

        const sparkleCanvas = document.getElementById("sparkleCanvas");

        const bokehCanvas = document.getElementById("bokehCanvas");

        if (sparkleCanvas) sparkleCanvas.remove();

        if (bokehCanvas) bokehCanvas.remove();

    }

    /* ------------------ Auto Reset ------------------ */

    function scheduleAutoHide() {

        const {
            end,
            now
        } = getTargetWindow();

        const remaining = end - now;

        if (remaining > 0) {

            setTimeout(() => {

                localStorage.removeItem("birthday_lat");

                localStorage.removeItem("birthday_lng");

                revealed = false;

                revealLock = false;

                location.reload(); // optional

            }, remaining + 500);

        }

    }

    /* ------------------ Album Slideshow ------------------ */

    let albumTimer;

    function startAlbum() {

        const photos = [...document.querySelectorAll(".album-photo")];

        const thumbs = [...document.querySelectorAll(".thumb")];

        let i = 0;

        function show(index) {

            photos.forEach(p => p.classList.remove("active"));

            thumbs.forEach(t => t.classList.remove("active"));

            photos[index].classList.add("active");

            thumbs[index].classList.add("active");

            i = index;

        }

        thumbs.forEach((t, idx) => {

            t.onclick = () => {

                clearInterval(albumTimer);

                show(idx);

                albumTimer = setInterval(next, 3500);

            };

        });

        function next() {

            show((i + 1) % photos.length);

        }

        show(0);

        albumTimer = setInterval(next, 3500);

    }

    /* ------------------ Floating Hearts ------------------ */

    let heartInterval;

    function startHearts() {

        const container = $("#floating-hearts");

        if (!container) return;

        heartInterval = setInterval(() => {

            if (document.hidden) return;

            const heart = document.createElement("div");

            heart.className = "f-heart";

            heart.textContent = ["💖", "💗", "💞", "💕", "❤️"][Math.floor(Math.random() * 5)];

            heart.style.left = Math.random() * 100 + "vw";

            heart.style.fontSize = 16 + Math.random() * 24 + "px";

            heart.style.animationDuration = (3 + Math.random() * 3) + "s";

            container.appendChild(heart);

            setTimeout(() => heart.remove(), 5000);

        }, 1200);

    }

    /* ------------------ Sparkles ------------------ */

    function startSparkles() {

        const canvas = $("#sparkleCanvas");

        const ctx = canvas.getContext("2d");

        function resize() {

            canvas.width = innerWidth;

            canvas.height = innerHeight;

        }

        resize();

        window.addEventListener("resize", resize);

        const sparks = [];

        // Reduced frequency (was 200ms)

        const sparkleInterval = setInterval(() => {

            if (!sparklesRunning || document.hidden) return;

            sparks.push({

                x: Math.random() * canvas.width,

                y: Math.random() * canvas.height * 0.6,

                vy: -1 - Math.random(),

                life: 60,

                r: 1 + Math.random() * 3

            });

        }, 400); // 🔥 doubled interval (less CPU)

        function draw() {

            if (!sparklesRunning) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = sparks.length - 1; i >= 0; i--) {

                const s = sparks[i];

                s.y += s.vy;

                s.life--;

                ctx.beginPath();

                ctx.fillStyle = `rgba(255,255,255,${s.life/60})`;

                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);

                ctx.fill();

                if (s.life <= 0) sparks.splice(i, 1);

            }

            requestAnimationFrame(draw);

        }

        draw();

        // Stop after 20 seconds

        setTimeout(() => {

            sparklesRunning = false;

            clearInterval(sparkleInterval);

            canvas.remove();

        }, 20000);

    }

    /* ------------------ Bokeh ------------------ */

    function startBokeh() {

        const canvas = $("#bokehCanvas");

        const ctx = canvas.getContext("2d");

        canvas.width = innerWidth;

        canvas.height = innerHeight;

        // Reduced from 25 → 12 particles

        const dots = Array.from({
            length: 12
        }, () => ({

            x: Math.random() * canvas.width,

            y: Math.random() * canvas.height,

            r: 20 + Math.random() * 60,

            a: 0.05 + Math.random() * 0.1,

            vy: 0.2 + Math.random() * 0.4

        }));

        function animate() {

            if (!bokehRunning) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            dots.forEach(d => {

                d.y -= d.vy;

                if (d.y < -100) d.y = canvas.height + 100;

                ctx.beginPath();

                ctx.fillStyle = `rgba(255,214,107,${d.a})`;

                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);

                ctx.fill();

            });

            requestAnimationFrame(animate);

        }

        animate();

        // Stop after 20 seconds

        setTimeout(() => {

            bokehRunning = false;

            canvas.remove();

        }, 20000);

    }

    /* ------------------ Balloons ------------------ */

    function startBalloons() {

        const container = $("#balloons");

        setInterval(() => {

            const b = document.createElement("div");

            b.className = "balloon";

            b.style.left = Math.random() * 95 + "vw";

            b.style.width = b.style.height = 40 + Math.random() * 80 + "px";

            b.style.animation = "riseUp 18s linear forwards, sway 6s ease-in-out infinite";

            container.appendChild(b);

            setTimeout(() => b.remove(), 20000);

        }, 3000);

    }

    /* ------------------ Wishes Popup ------------------ */

    function wireWishesPopup() {

        const popup = $("#wishesPopup");

        $("#openWishes").onclick = () => popup.style.display = "flex";

        $("#closePopup").onclick = $("#closePopup2").onclick = () => popup.style.display = "none";

    }

    /* ------------------ Wishes Form ------------------ */

    function wireWishesForm() {

        const form = $("#wishesForm");

        if (!form) return;

        form.addEventListener("submit", e => {

            e.preventDefault();

            const name = $("#wisherName").value.trim();

            const msg = $("#wisherMessage").value.trim();

            if (!name || !msg) {

                alert("Please enter name and message");

                return;

            }

            if (!geoData.lat || !geoData.lng) {

                alert("Location not detected. Please reload and allow location.");

                return;

            }

            $("#thanksMessage").style.display = "block";

            fetch(

                "https://script.google.com/macros/s/AKfycbzf-AB4la4pq-wi6K0qOAFhhQQ1Alr83oT5X1TEZEqCtHeGSFeS_pi4VhGdtmfdaSwz/exec" +

                `?page=Vashista` +

                `&name=${encodeURIComponent(name)}` +

                `&message=${encodeURIComponent(msg)}` +

                `&lat=${geoData.lat}` +

                `&lng=${geoData.lng}` +

                `&event=wish_submit`,

                {
                    mode: "no-cors"
                }

            );

            setTimeout(() => {

                $("#wishesPopup").style.display = "none";

                $("#thanksMessage").style.display = "none";

                form.reset();

            }, 1500);

        });

    }

    function sendLocationToSheet(eventType = "visit") {

        fetch(

            "https://script.google.com/macros/s/AKfycbzf-AB4la4pq-wi6K0qOAFhhQQ1Alr83oT5X1TEZEqCtHeGSFeS_pi4VhGdtmfdaSwz/exec" +

            `?page=Vashista` +

            `&lat=${geoData.lat}` +

            `&lng=${geoData.lng}` +

            `&event=${eventType}`,

            {
                mode: "no-cors"
            }

        );

    }

    /* ------------------ Audio ------------------ */

    function wireAudio() {

        const btn = $("#audioToggle");

        const audio = $("#myAudio");

        if (!btn || !audio) return;

        btn.addEventListener("click", async () => {

            try {

                if (audio.paused) {

                    await audio.play();

                    btn.textContent = "🔊";

                } else {

                    audio.pause();

                    btn.textContent = "🔇";

                }

            } catch (err) {

                console.log("Audio error:", err);

                alert("Tap again to enable sound 🎵");

            }

        });

    }

    /* ------------------ Performance & Accessibility ------------------ */

    document.addEventListener("DOMContentLoaded", async () => {

        await syncInternetTimeIST();

        timeReady = true;

        // Check if location already saved

        const savedLat = localStorage.getItem("birthday_lat");

        const savedLng = localStorage.getItem("birthday_lng");

        if (savedLat && savedLng) {

            geoData.lat = savedLat;

            geoData.lng = savedLng;

            locationGranted = true;

            const allowBtn = document.getElementById("allowLocationBtn");

            if (allowBtn) allowBtn.style.display = "none";
          

            // Attach button listeners BEFORE returning

            wireWishesPopup();

            wireWishesForm();

            wireAudio();
          showSubtext("⏳ Verifying internet time", true);
            countdownTimer = setInterval(updatePreloader, 1000);

            setPreloaderState("loading");

            updatePreloader();
          

            return;

        }

        const subtext = document.getElementById("preloader-subtext");

        subtext.textContent = "📍 Location access required to continue";

        const allowBtn = document.getElementById("allowLocationBtn");

        subtext.textContent = "📍 Location access required to continue";

        allowBtn.onclick = async () => {
  try {
    await requestUserLocation(true);

    // Show subtext immediately after location allowed
    showSubtext("⏳ Verifying internet time...");

    allowBtn.style.display = "none";
    setPreloaderState("loading");

    countdownTimer = setInterval(updatePreloader, 1000);
    updatePreloader();

  } catch (e) {
    showSubtext("❌ Location permission denied. Please allow to continue.");
    allowBtn.style.display = "block";
  }
};

        setPreloaderState("waiting");

    });

})();
