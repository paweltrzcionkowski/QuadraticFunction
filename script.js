document.addEventListener('DOMContentLoaded', function () {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // Funkcja do aktualizacji motywu w Plotly
    const updatePlotlyTheme = (plotDiv) => {
        // Sprawdza aktualny motyw
        const isDark = document.body.classList.contains('dark-mode');
        const color = isDark ? '#e0e0e0' : '#333';
        const bgColor = isDark ? '#2e2e2e' : '#fff';

        const newLayout = {
            'paper_bgcolor': bgColor,
            'plot_bgcolor': bgColor,
            'font.color': color,
            'xaxis.linecolor': color,
            'xaxis.tickcolor': color,
            'xaxis.zerolinecolor': color,
            'xaxis.gridcolor': isDark ? '#333' : '#33333366', // Używamy jaśniejszej siatki w trybie jasnym
            'yaxis.linecolor': color,
            'yaxis.tickcolor': color,
            'yaxis.zerolinecolor': color,
            'yaxis.gridcolor': isDark ? '#333' : '#33333366',
        };
        // Użycie relayout do zmiany stylu Plotly bez przerysowania danych
        Plotly.relayout(plotDiv, newLayout);
    };

    // Funkcja do ustawiania motywu
    const setTheme = (isDark) => {
        if (isDark) {
            document.body.classList.add('dark-mode');
            themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            themeIcon.textContent = '🌞';
            localStorage.setItem('theme', 'light');
        }
        
        // Aktualizacja wykresu Plotly po zmianie motywu, jeśli już istnieje
        const plotDiv = document.getElementById('plot-div');
        // Zapewnienie, że Plotly jest załadowane i div istnieje
        if (typeof Plotly !== 'undefined' && plotDiv && plotDiv.data) {
             updatePlotlyTheme(plotDiv);
        }
    };

    // Detekcja preferencji użytkownika (automatyczny motyw)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        setTheme(savedTheme === 'dark');
    } else {
        setTheme(prefersDark.matches);
    }

    prefersDark.addEventListener('change', (e) => setTheme(e.matches));

    // Obsługa przycisku zmiany motywu
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        setTheme(!isDark);
    });
});

// LOGIKA OBLICZEŃ
document.getElementById('calculate-button').addEventListener('click', function () {
    const a = parseFloat(document.getElementById('a').value);
    const b = parseFloat(document.getElementById('b').value);
    const c = parseFloat(document.getElementById('c').value);
    const resultDiv = document.getElementById('result');

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
        resultDiv.innerHTML = 'Proszę podać poprawne liczby.';
        return;
    }

    if (a === 0) {
        resultDiv.innerHTML = 'To nie jest funkcja kwadratowa (a musi być różne od 0).';
        return;
    }

    const discriminant = b * b - 4 * a * c;
    if (discriminant > 0) {
        const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        resultDiv.innerHTML = `Dwa miejsca zerowe: x₁ = ${x1.toFixed(2)}, x₂ = ${x2.toFixed(2)}`;
    } else if (discriminant === 0) {
        const x = -b / (2 * a);
        resultDiv.innerHTML = `Jedno miejsce zerowe: x = ${x.toFixed(2)}`;
    } else {
        resultDiv.innerHTML = 'Brak miejsc zerowych (delta < 0).';
    }
});

// LOGIKA RYSOWANIA PLOTLY.JS
document.getElementById('plot-button').addEventListener('click', function () {
    const a = parseFloat(document.getElementById('a').value);
    const b = parseFloat(document.getElementById('b').value);
    const c = parseFloat(document.getElementById('c').value);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
        alert('Proszę podać poprawne liczby.');
        return;
    }
    
    if (a === 0) {
        alert('Dla paraboli "a" musi być różne od 0.');
        return;
    }

    const modal = document.getElementById('plot-modal');
    // UWAGA: Plotly musi rysować do div o ID 'plot-div' (zgodnie z naszymi ustaleniami)
    const plotDiv = document.getElementById('plot-div'); 

    modal.style.display = 'flex';

    // --- OBLICZANIE KLUCZOWYCH PUNKTÓW ---
    
    const discriminant = b * b - 4 * a * c;
    const vertexX = -b / (2 * a);
    const vertexY = a * vertexX * vertexX + b * vertexX + c; // f(p)
    
    // Inicjalizacja tablic dla kluczowych punktów (zaczynamy od wierzchołka)
    const keyPointsX = [vertexX];
    const keyPointsY = [vertexY];
    const keyPointsText = [`Wierzchołek V(${vertexX.toFixed(2)}, ${vertexY.toFixed(2)})`];

    // Miejsca Zerowe
    if (discriminant >= 0) {
        if (discriminant > 0) {
            const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            
            keyPointsX.push(x1, x2);
            keyPointsY.push(0, 0); 
            keyPointsText.push(`Miejsce zerowe X1(${x1.toFixed(2)}, 0)`, `Miejsce zerowe X2(${x2.toFixed(2)}, 0)`);
        } else { // Delta = 0
            const x = vertexX; 
            keyPointsX.push(x);
            keyPointsY.push(0);
            keyPointsText.push(`Miejsce zerowe X(${x.toFixed(2)}, 0)`);
        }
    }

    // --- GENEROWANIE PUNKTÓW DLA LINI (Zwiększony Zakres X) ---
    
    const xValues = [];
    const yValues = [];
    
    // ZMIANA TUTAJ: Dynamiczne ustawienie zakresu X na +/- 100
    // Ustawiamy bufor 50 wokół wierzchołka i minimalny/maksymalny zakres krańcowy na +/- 100.
    const xRangeBuffer = 50;
    const xAbsMin = -100;
    const xAbsMax = 100;

    let xMin = Math.min(vertexX - xRangeBuffer, xAbsMin);
    let xMax = Math.max(vertexX + xRangeBuffer, xAbsMax);
    
    // Używamy małego kroku dla gładkiej linii
    for (let x = xMin; x <= xMax; x += 0.05) {
        xValues.push(x);
        yValues.push(a * x * x + b * x + c);
    }
    
    // Ustawienia motywu
    const isDark = document.body.classList.contains('dark-mode');
    const color = isDark ? '#e0e0e0' : '#333';
    const bgColor = isDark ? '#2e2e2e' : '#fff';
    
    // --- STRUKTURA DANYCH PLOTLY ---
    
    const parabolaTrace = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        name: `f(x) = ${a}x² + ${b}x + ${c}`,
        line: {
            color: '#007BFF',
            width: 3
        }
    };
    
    const keyPointsTrace = {
        x: keyPointsX,
        y: keyPointsY,
        mode: 'markers',
        type: 'scatter',
        name: 'Kluczowe Punkty',
        text: keyPointsText, 
        hoverinfo: 'text',
        marker: {
            color: '#FFD700', 
            size: 10,
            symbol: 'circle',
            line: {
                color: 'rgba(255, 255, 255, 0.7)',
                width: 1
            }
        }
    };
    
    const data = [parabolaTrace, keyPointsTrace];

    // --- LAYOUT I KONFIGURACJA PLOTLY ---
    
    const layout = {
        title: {
            text: `<b>${a}x² + ${b}x + ${c}</b>`,
            font: { size: 18, color: color }
        },
        xaxis: {
            title: '<b>x</b>',
            zeroline: true,
            zerolinecolor: color,
            showgrid: true,
            gridcolor: isDark ? '#333' : '#33333366',
        },
        yaxis: {
            title: '<b>y</b>',
            zeroline: true,
            zerolinecolor: color,
            showgrid: true,
            gridcolor: isDark ? '#333' : '#33333366',
            autorange: true, // Automatyczne dostosowanie zakresu Y
        },
        margin: { t: 50, r: 20, b: 50, l: 50 },
        hovermode: 'closest',
        paper_bgcolor: bgColor, 
        plot_bgcolor: bgColor, 
        font: { color: color },
    };
    
    const config = {
        responsive: true,
        scrollZoom: true, 
        displayModeBar: true,
        modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toggleSpikelines'],
        displaylogo: false
    };

    // Rysowanie wykresu
    Plotly.newPlot(plotDiv, data, layout, config);
});

// Close the modal
document.getElementById('close-modal').addEventListener('click', function () {
    const modal = document.getElementById('plot-modal');
    modal.style.display = 'none';
});