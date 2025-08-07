document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let vehicles = [];
    let emergencyContacts = [];
    let appointments = [];
    let currentVehicleId = null;
    
    // Mostrar/ocultar secciones
    window.showSection = function(sectionId) {
        document.getElementById('dashboard').style.display = 'none';
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';
        
        // Cargar datos específicos de la sección
        if(sectionId === 'formulario') {
            loadVehicles();
        } else if(sectionId === 'telefonos') {
            loadEmergencyContacts();
        } else if(sectionId === 'agenda') {
            loadAppointments();
            updateUpcomingEvents();
        }
    };

    window.hideSection = function(sectionId) {
        document.getElementById(sectionId).style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    };

    // Inicializar Google Maps
    function initMap() {
        const defaultLocation = { lat: 13.6929, lng: -89.2182 };
        const map = new google.maps.Map(document.getElementById('googleMap'), {
            zoom: 12,
            center: defaultLocation,
            styles: [
                {
                    "featureType": "poi",
                    "elementType": "labels",
                    "stylers": [
                        { "visibility": "off" }
                    ]
                }
            ]
        });
        
        // Marcador por defecto
        new google.maps.Marker({
            position: defaultLocation,
            map: map,
            title: 'Ubicación actual',
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }
        });
        
        // Buscar ubicación
        document.getElementById('searchMap').addEventListener('click', function() {
            const location = document.getElementById('searchLocation').value;
            if(location) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ 'address': location }, function(results, status) {
                    if(status === 'OK') {
                        map.setCenter(results[0].geometry.location);
                        
                        // Limpiar marcadores anteriores
                        if(window.currentMarker) {
                            window.currentMarker.setMap(null);
                        }
                        
                        window.currentMarker = new google.maps.Marker({
                            map: map,
                            position: results[0].geometry.location,
                            title: location
                        });
                    } else {
                        alert('No se pudo encontrar la ubicación: ' + status);
                    }
                });
            }
        });
        
        // Alternar tráfico
        const trafficLayer = new google.maps.TrafficLayer();
        document.getElementById('trafficToggle').addEventListener('change', function() {
            this.checked ? trafficLayer.setMap(map) : trafficLayer.setMap(null);
        });
        
        // Mostrar talleres cercanos
        document.getElementById('placesToggle').addEventListener('change', function() {
            if(this.checked) {
                const service = new google.maps.places.PlacesService(map);
                service.nearbySearch({
                    location: defaultLocation,
                    radius: 5000,
                    type: ['car_repair']
                }, (results, status) => {
                    if (status === "OK") {
                        // Limpiar marcadores anteriores
                        if(window.placeMarkers) {
                            window.placeMarkers.forEach(marker => marker.setMap(null));
                        }
                        
                        window.placeMarkers = [];
                        results.forEach(place => {
                            const marker = new google.maps.Marker({
                                map: map,
                                position: place.geometry.location,
                                title: place.name,
                                icon: {
                                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                }
                            });
                            window.placeMarkers.push(marker);
                        });
                    }
                });
            } else {
                if(window.placeMarkers) {
                    window.placeMarkers.forEach(marker => marker.setMap(null));
                    window.placeMarkers = null;
                }
            }
        });
    }
    window.initMap = initMap;

    // Juego de Quiz mejorado
    const quizQuestions = [
        {
            question: "¿Cada cuánto tiempo se debe cambiar el aceite del motor?",
            options: [
                "Cada 3,000 km o 3 meses",
                "Cada 10,000 km o 1 año",
                "Solo cuando se vea sucio",
                "Cada 5,000 km o 6 meses (lo que ocurra primero)"
            ],
            answer: 3,
            explanation: "La mayoría de fabricantes recomiendan cambiar el aceite cada 5,000 km o 6 meses, aunque esto puede variar según el modelo."
        },
        {
            question: "¿Qué indica la luz del check engine?",
            options: [
                "Problemas con el motor",
                "Falla en el sistema eléctrico",
                "Ambas son correctas",
                "Necesidad de cambio de aceite"
            ],
            answer: 2,
            explanation: "La luz del check engine puede indicar diversos problemas, desde fallos en el motor hasta problemas en el sistema eléctrico."
        },
        {
            question: "¿Cuál es la presión adecuada para los neumáticos?",
            options: [
                "La misma para todos los vehículos",
                "30 PSI siempre",
                "La que recomienda el fabricante",
                "Depende del clima"
            ],
            answer: 2,
            explanation: "Cada vehículo tiene una presión recomendada por el fabricante, que suele encontrarse en el manual o en una pegatina en el marco de la puerta."
        },
        {
            question: "¿Qué componente NO es parte del sistema de frenos?",
            options: [
                "Discos de freno",
                "Pastillas de freno",
                "Banda de distribución",
                "Líquido de frenos"
            ],
            answer: 2,
            explanation: "La banda de distribución es parte del sistema de transmisión, no del sistema de frenos."
        },
        {
            question: "¿Cuándo se debe reemplazar el filtro de aire?",
            options: [
                "Cada 10,000 km",
                "Cuando esté visiblemente sucio",
                "Según las recomendaciones del fabricante",
                "Nunca, es de por vida"
            ],
            answer: 2,
            explanation: "Aunque hay intervalos generales, lo mejor es seguir las recomendaciones específicas del fabricante de tu vehículo."
        }
    ];

    let currentQuestion = 0;
    let score = 0;
    let selectedOption = null;

    window.startGame = function(game) {
        if(game === 'quiz') {
            document.querySelectorAll('#gamificacion > .row')[0].style.display = 'none';
            document.getElementById('quizGame').style.display = 'block';
            resetQuiz();
            loadQuestion(currentQuestion);
        } else if(game === 'memory') {
            document.querySelectorAll('#gamificacion > .row')[0].style.display = 'none';
            document.getElementById('memoryGame').style.display = 'block';
            setupMemoryGame();
        } else if(game === 'dragdrop') {
            document.querySelectorAll('#gamificacion > .row')[0].style.display = 'none';
            document.getElementById('dragdropGame').style.display = 'block';
            setupDragdropGame();
        } else if(game === 'wordsearch') {
            document.querySelectorAll('#gamificacion > .row')[0].style.display = 'none';
            document.getElementById('wordsearchGame').style.display = 'block';
            setupWordsearchGame();
        } else {
            alert('Juego no implementado aún');
            return;
        }
    };

    window.closeGame = function(game) {
        if(game === 'quiz') {
            document.getElementById('quizGame').style.display = 'none';
        } else if(game === 'memory') {
            document.getElementById('memoryGame').style.display = 'none';
        } else if(game === 'dragdrop') {
            document.getElementById('dragdropGame').style.display = 'none';
        } else if(game === 'wordsearch') {
            document.getElementById('wordsearchGame').style.display = 'none';
        }
        document.querySelectorAll('#gamificacion > .row')[0].style.display = 'flex';
    };

    function resetQuiz() {
        currentQuestion = 0;
        score = 0;
        document.getElementById('quizResults').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        document.getElementById('quizTotal').textContent = quizQuestions.length;
    }

    function loadQuestion(index) {
        if(index < quizQuestions.length) {
            const question = quizQuestions[index];
            document.getElementById('quizQuestion').textContent = question.question;
            
            const optionsContainer = document.getElementById('quizOptions');
            optionsContainer.innerHTML = '';
            
            question.options.forEach((option, i) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'form-check';
                
                const input = document.createElement('input');
                input.className = 'form-check-input';
                input.type = 'radio';
                input.name = 'quizOption';
                input.id = `option${i}`;
                input.value = i;
                input.addEventListener('change', function() {
                    selectedOption = i;
                });
                
                const label = document.createElement('label');
                label.className = 'form-check-label';
                label.htmlFor = `option${i}`;
                label.textContent = option;
                
                optionDiv.appendChild(input);
                optionDiv.appendChild(label);
                optionsContainer.appendChild(optionDiv);
            });
            
            document.getElementById('nextQuestion').textContent = 
                index === quizQuestions.length - 1 ? 'Finalizar' : 'Siguiente';
            
            // Actualizar progreso
            const progress = ((index) / quizQuestions.length) * 100;
            document.getElementById('quizProgress').style.width = `${progress}%`;
        } else {
            showResults();
        }
    }

    document.getElementById('nextQuestion').addEventListener('click', function() {
        if(selectedOption !== null) {
            if(selectedOption === quizQuestions[currentQuestion].answer) {
                score++;
            }
            
            currentQuestion++;
            selectedOption = null;
            loadQuestion(currentQuestion);
        } else {
            alert('Por favor selecciona una respuesta');
        }
    });

    function showResults() {
        document.getElementById('quizContainer').style.display = 'none';
        document.getElementById('quizResults').style.display = 'block';
        
        document.getElementById('quizScore').textContent = score;
        const feedback = document.getElementById('quizFeedback');
        feedback.innerHTML = '';
        
        const percentage = (score / quizQuestions.length) * 100;
        let message = '';
        
        if(percentage >= 80) {
            message = '<p class="text-success">¡Excelente! Tienes un gran conocimiento sobre vehículos.</p>';
        } else if(percentage >= 60) {
            message = '<p class="text-primary">¡Buen trabajo! Pero aún hay cosas por aprender.</p>';
        } else {
            message = '<p class="text-warning">Sigue practicando, mejorarás con el tiempo.</p>';
        }
        
        feedback.innerHTML = message + 
            `<div class="mt-3 text-start">
                <h6>Resumen de respuestas:</h6>
                ${quizQuestions.map((q, i) => 
                    `<p class="small mb-1"><strong>Pregunta ${i+1}:</strong> ${q.explanation}</p>`
                ).join('')}
            </div>`;
    }

    window.retryQuiz = function() {
        resetQuiz();
        loadQuestion(currentQuestion);
    };

    // Juego de Memorama
    const memoryParts = [
        { name: "Motor", icon: "bi-gear-wide", description: "Proporciona potencia al vehículo" },
        { name: "Batería", icon: "bi-battery-full", description: "Proporciona energía eléctrica" },
        { name: "Radiador", icon: "bi-thermometer-sun", description: "Enfría el motor" },
        { name: "Frenos", icon: "bi-brake-pad", description: "Permiten detener el vehículo" },
        { name: "Alternador", icon: "bi-lightning-charge", description: "Carga la batería" },
        { name: "Transmisión", icon: "bi-gear", description: "Transmite potencia a las ruedas" },
        { name: "Amortiguadores", icon: "bi-slash-circle", description: "Absorben impactos" },
        { name: "Dirección", icon: "bi-steering-wheel", description: "Controla la dirección del vehículo" }
    ];

    let memoryCards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let attempts = 0;

    function setupMemoryGame() {
        memoryCards = [];
        flippedCards = [];
        matchedPairs = 0;
        attempts = 0;
        
        // Duplicar las cartas para hacer parejas
        let cards = [...memoryParts, ...memoryParts];
        
        // Barajar las cartas
        cards = cards.sort(() => Math.random() - 0.5);
        
        const board = document.getElementById('memoryBoard');
        board.innerHTML = '';
        
        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.index = index;
            cardElement.dataset.name = card.name;
            cardElement.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-front">
                        <i class="bi bi-question-lg"></i>
                    </div>
                    <div class="memory-card-back">
                        <i class="bi ${card.icon}"></i>
                        <span>${card.name}</span>
                        <small>${card.description}</small>
                    </div>
                </div>
            `;
            cardElement.addEventListener('click', flipCard);
            board.appendChild(cardElement);
            memoryCards.push({
                element: cardElement,
                name: card.name,
                flipped: false,
                matched: false
            });
        });
        
        document.getElementById('memoryAttempts').textContent = attempts;
        document.getElementById('memoryMatches').textContent = matchedPairs;
        document.getElementById('memoryResults').style.display = 'none';
    }

    function flipCard() {
        const index = this.dataset.index;
        const card = memoryCards[index];
        
        // No hacer nada si la carta ya está volteada o emparejada
        if(card.flipped || card.matched || flippedCards.length === 2) return;
        
        // Voltear la carta
        card.flipped = true;
        this.classList.add('flipped');
        
        // Agregar a las cartas volteadas
        flippedCards.push(card);
        
        // Si hay dos cartas volteadas, comprobar si son pareja
        if(flippedCards.length === 2) {
            attempts++;
            document.getElementById('memoryAttempts').textContent = attempts;
            
            if(flippedCards[0].name === flippedCards[1].name) {
                // Son pareja
                flippedCards[0].matched = true;
                flippedCards[1].matched = true;
                matchedPairs++;
                document.getElementById('memoryMatches').textContent = matchedPairs;
                
                flippedCards = [];
                
                // Comprobar si se completó el juego
                if(matchedPairs === memoryParts.length) {
                    setTimeout(() => {
                        document.getElementById('finalAttempts').textContent = attempts;
                        document.getElementById('memoryResults').style.display = 'block';
                    }, 500);
                }
            } else {
                // No son pareja, voltear de nuevo después de un tiempo
                setTimeout(() => {
                    flippedCards[0].flipped = false;
                    flippedCards[1].flipped = false;
                    
                    flippedCards[0].element.classList.remove('flipped');
                    flippedCards[1].element.classList.remove('flipped');
                    
                    flippedCards = [];
                }, 1000);
            }
        }
    }

    // Juego de Arrastrar y Soltar
    const engineParts = [
        { id: 'bateria', name: 'Batería', icon: 'bi-battery-full', correctPosition: 'parte-delantera' },
        { id: 'alternador', name: 'Alternador', icon: 'bi-lightning-charge', correctPosition: 'parte-frontal' },
        { id: 'radiador', name: 'Radiador', icon: 'bi-thermometer-sun', correctPosition: 'parte-delantera' },
        { id: 'filtro-aire', name: 'Filtro de Aire', icon: 'bi-fan', correctPosition: 'parte-superior' },
        { id: 'aceite', name: 'Depósito de Aceite', icon: 'bi-droplet', correctPosition: 'parte-inferior' },
        { id: 'bujias', name: 'Bujías', icon: 'bi-plug', correctPosition: 'parte-superior' }
    ];

    function setupDragdropGame() {
        const piecesContainer = document.getElementById('dragdropPieces');
        const targetContainer = document.getElementById('dragdropTarget');
        
        piecesContainer.innerHTML = '';
        targetContainer.innerHTML = '';
        
        // Barajar las piezas
        const shuffledParts = [...engineParts].sort(() => Math.random() - 0.5);
        
        // Crear piezas arrastrables
        shuffledParts.forEach(part => {
            const piece = document.createElement('div');
            piece.className = 'dragdrop-piece';
            piece.id = `piece-${part.id}`;
            piece.draggable = true;
            piece.dataset.partId = part.id;
            piece.innerHTML = `
                <i class="bi ${part.icon}"></i>
                <div>${part.name}</div>
            `;
            
            piece.addEventListener('dragstart', dragStart);
            piecesContainer.appendChild(piece);
        });
        
        // Crear espacios objetivo
        engineParts.forEach(part => {
            const slot = document.createElement('div');
            slot.className = 'dragdrop-slot';
            slot.id = `slot-${part.correctPosition}`;
            slot.dataset.correctPart = part.id;
            slot.dataset.position = part.correctPosition;
            slot.innerHTML = `<small>${part.correctPosition.replace('parte-', '').toUpperCase()}</small>`;
            
            slot.addEventListener('dragover', dragOver);
            slot.addEventListener('dragenter', dragEnter);
            slot.addEventListener('dragleave', dragLeave);
            slot.addEventListener('drop', drop);
            slot.addEventListener('dragend', dragEnd);
            
            targetContainer.appendChild(slot);
        });
        
        document.getElementById('dragdropContainer').style.display = 'block';
        document.getElementById('dragdropResults').style.display = 'none';
    }

    let draggedPiece = null;

    function dragStart(e) {
        draggedPiece = e.target;
        e.dataTransfer.setData('text/plain', e.target.id);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('dragdrop-slot')) {
            e.target.classList.add('highlight');
        }
    }

    function dragLeave(e) {
        if (e.target.classList.contains('dragdrop-slot')) {
            e.target.classList.remove('highlight');
        }
    }

    function drop(e) {
        e.preventDefault();
        if (e.target.classList.contains('dragdrop-slot')) {
            e.target.classList.remove('highlight');
            
            // Mover la pieza al espacio objetivo
            const pieceId = e.dataTransfer.getData('text/plain');
            const piece = document.getElementById(pieceId);
            const partId = piece.dataset.partId;
            const correctPart = e.target.dataset.correctPart;
            
            // Verificar si es correcto
            if (partId === correctPart) {
                e.target.classList.add('correct');
                e.target.innerHTML = piece.innerHTML;
                
                // Eliminar la pieza del área de origen
                piece.remove();
                
                // Verificar si todas las piezas están colocadas correctamente
                checkDragdropCompletion();
            } else {
                e.target.classList.add('incorrect');
                setTimeout(() => {
                    e.target.classList.remove('incorrect');
                }, 1000);
            }
        }
    }

    function dragEnd(e) {
        e.target.classList.remove('dragging');
    }

    function checkDragdropCompletion() {
        const remainingPieces = document.querySelectorAll('#dragdropPieces .dragdrop-piece');
        if (remainingPieces.length === 0) {
            // Todas las piezas colocadas
            document.getElementById('dragdropContainer').style.display = 'none';
            document.getElementById('dragdropResults').style.display = 'block';
        }
    }

    document.getElementById('checkDragdrop').addEventListener('click', function() {
        const slots = document.querySelectorAll('#dragdropTarget .dragdrop-slot');
        let allCorrect = true;
        
        slots.forEach(slot => {
            const piece = slot.querySelector('.dragdrop-piece');
            if (!piece || piece.dataset.partId !== slot.dataset.correctPart) {
                slot.classList.add('incorrect');
                allCorrect = false;
            } else {
                slot.classList.add('correct');
            }
        });
        
        if (allCorrect) {
            document.getElementById('dragdropContainer').style.display = 'none';
            document.getElementById('dragdropResults').style.display = 'block';
        }
    });

    // Juego de Sopa de Letras
    const wordsearchWords = [
        'MOTOR', 'FRENOS', 'BATERIA', 'ACEITE', 'RUEDAS', 
        'RADIADOR', 'ALTERNADOR', 'TRANSMISION', 'FILTRO', 'BUJIAS'
    ];

    function setupWordsearchGame() {
        const gridSize = 12;
        const grid = document.getElementById('wordsearchGrid');
        grid.innerHTML = '';
        
        // Crear matriz vacía
        const matrix = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
        
        // Colocar palabras en la matriz
        wordsearchWords.forEach(word => {
            let placed = false;
            while (!placed) {
                const direction = Math.floor(Math.random() * 3); // 0: horizontal, 1: vertical, 2: diagonal
                const row = Math.floor(Math.random() * (gridSize - (direction === 2 ? word.length : 0)));
                const col = Math.floor(Math.random() * (gridSize - (direction === 1 ? word.length : 0)));
                
                // Verificar si se puede colocar la palabra
                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                    let r = row + (direction === 2 ? i : 0);
                    let c = col + (direction === 1 ? i : 0);
                    
                    if (matrix[r][c] !== '' && matrix[r][c] !== word[i]) {
                        canPlace = false;
                        break;
                    }
                }
                
                // Colocar la palabra si es posible
                if (canPlace) {
                    for (let i = 0; i < word.length; i++) {
                        let r = row + (direction === 2 ? i : 0);
                        let c = col + (direction === 1 ? i : 0);
                        matrix[r][c] = word[i];
                    }
                    placed = true;
                }
            }
        });
        
        // Rellenar espacios vacíos con letras aleatorias
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (matrix[i][j] === '') {
                    matrix[i][j] = letters.charAt(Math.floor(Math.random() * letters.length));
                }
            }
        }
        
        // Crear la cuadrícula en el DOM
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'wordsearch-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.textContent = matrix[i][j];
                cell.addEventListener('click', selectWordsearchCell);
                grid.appendChild(cell);
            }
        }
        
        // Mostrar palabras a encontrar
        const wordsContainer = document.getElementById('wordsearchWords');
        wordsContainer.innerHTML = '';
        wordsearchWords.forEach(word => {
            const wordElement = document.createElement('div');
            wordElement.className = 'wordsearch-word';
            wordElement.textContent = word;
            wordElement.dataset.word = word;
            wordsContainer.appendChild(wordElement);
        });
        
        document.getElementById('wordsFound').textContent = '0';
        document.getElementById('totalWords').textContent = wordsearchWords.length;
        document.getElementById('wordsearchContainer').style.display = 'block';
        document.getElementById('wordsearchResults').style.display = 'none';
    }

    let selectedCells = [];
    let foundWords = [];

    function selectWordsearchCell(e) {
        const cell = e.target;
        
        // Si ya está seleccionada, quitar selección
        if (cell.classList.contains('selected')) {
            cell.classList.remove('selected');
            selectedCells = selectedCells.filter(c => c !== cell);
            return;
        }
        
        // Agregar a celdas seleccionadas
        cell.classList.add('selected');
        selectedCells.push(cell);
        
        // Si hay más de una celda seleccionada, verificar si forman una palabra
        if (selectedCells.length > 1) {
            checkWordselection();
        }
    }

    function checkWordselection() {
        // Ordenar celdas por fila y columna
        selectedCells.sort((a, b) => {
            const rowA = parseInt(a.dataset.row);
            const rowB = parseInt(b.dataset.row);
            const colA = parseInt(a.dataset.col);
            const colB = parseInt(b.dataset.col);
            
            if (rowA !== rowB) return rowA - rowB;
            return colA - colB;
        });
        
        // Verificar si están en línea recta
        const firstCell = selectedCells[0];
        const lastCell = selectedCells[selectedCells.length - 1];
        const rowDiff = parseInt(lastCell.dataset.row) - parseInt(firstCell.dataset.row);
        const colDiff = parseInt(lastCell.dataset.col) - parseInt(firstCell.dataset.col);
        
        let isStraightLine = false;
        if (rowDiff === 0) {
            // Horizontal
            isStraightLine = true;
            for (let i = 1; i < selectedCells.length - 1; i++) {
                if (parseInt(selectedCells[i].dataset.row) !== parseInt(firstCell.dataset.row)) {
                    isStraightLine = false;
                    break;
                }
            }
        } else if (colDiff === 0) {
            // Vertical
            isStraightLine = true;
            for (let i = 1; i < selectedCells.length - 1; i++) {
                if (parseInt(selectedCells[i].dataset.col) !== parseInt(firstCell.dataset.col)) {
                    isStraightLine = false;
                    break;
                }
            }
        } else if (Math.abs(rowDiff) === Math.abs(colDiff)) {
            // Diagonal
            isStraightLine = true;
            const rowStep = rowDiff > 0 ? 1 : -1;
            const colStep = colDiff > 0 ? 1 : -1;
            
            for (let i = 1; i < selectedCells.length; i++) {
                const expectedRow = parseInt(firstCell.dataset.row) + (i * rowStep);
                const expectedCol = parseInt(firstCell.dataset.col) + (i * colStep);
                
                if (parseInt(selectedCells[i].dataset.row) !== expectedRow || 
                    parseInt(selectedCells[i].dataset.col) !== expectedCol) {
                    isStraightLine = false;
                    break;
                }
            }
        }
        
        if (isStraightLine) {
            // Formar palabra con las letras seleccionadas
            const word = selectedCells.map(cell => cell.textContent).join('');
            
            // Verificar si es una de las palabras buscadas
            if (wordsearchWords.includes(word) && !foundWords.includes(word)) {
                foundWords.push(word);
                
                // Marcar celdas como encontradas
                selectedCells.forEach(cell => {
                    cell.classList.remove('selected');
                    cell.classList.add('found');
                });
                
                // Marcar palabra como encontrada
                const wordElements = document.querySelectorAll('.wordsearch-word');
                wordElements.forEach(el => {
                    if (el.dataset.word === word) {
                        el.classList.add('found');
                    }
                });
                
                // Actualizar contador
                document.getElementById('wordsFound').textContent = foundWords.length;
                
                // Verificar si se completó el juego
                if (foundWords.length === wordsearchWords.length) {
                    document.getElementById('wordsearchContainer').style.display = 'none';
                    document.getElementById('wordsearchResults').style.display = 'block';
                }
            } else {
                // No es una palabra buscada o ya fue encontrada
                selectedCells.forEach(cell => {
                    cell.classList.remove('selected');
                });
            }
        } else {
            // No es una línea recta
            selectedCells.forEach(cell => {
                cell.classList.remove('selected');
            });
        }
        
        selectedCells = [];
    }

    function showWordsearchWords() {
        const wordElements = document.querySelectorAll('.wordsearch-word');
        wordElements.forEach(el => {
            el.classList.add('found');
        });
    }

    // Manejo del formulario de agenda
    document.getElementById('appointmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const vehicleId = document.getElementById('appointmentVehicle').value;
        const date = document.getElementById('appointmentDate').value;
        const time = document.getElementById('appointmentTime').value;
        const type = document.getElementById('appointmentType').value;
        const location = document.getElementById('appointmentLocation').value;
        const notes = document.getElementById('appointmentNotes').value;
        
        // Obtener información del vehículo
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            alert('Por favor selecciona un vehículo válido');
            return;
        }
        
        // Crear objeto de cita
        const appointment = {
            id: Date.now().toString(),
            vehicleId,
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            date,
            time,
            type,
            location,
            notes,
            createdAt: new Date().toISOString()
        };
        
        // Agregar a la lista de citas
        appointments.push(appointment);
        
        // Guardar en localStorage
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Actualizar lista de eventos próximos
        updateUpcomingEvents();
        
        // Mostrar mensaje de éxito
        alert(`Cita agendada para el ${date} a las ${time} en ${location} para el vehículo ${vehicle.brand} ${vehicle.model}`);
        
        // Reiniciar formulario
        this.reset();
    });

    // Manejo del formulario de vehículo
    document.getElementById('vehicleForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const brand = document.getElementById('vehicleBrand').value;
        const model = document.getElementById('vehicleModel').value;
        const plate = document.getElementById('plateNumber').value;
        const year = document.getElementById('vehicleYear').value;
        const mileage = document.getElementById('currentMileage').value;
        const color = document.getElementById('vehicleColor').value;
        const condition = document.getElementById('vehicleCondition').value;
        const notes = document.getElementById('additionalNotes').value;
        
        // Crear objeto de vehículo
        const vehicle = {
            id: Date.now().toString(),
            brand,
            model,
            plate,
            year,
            mileage,
            color,
            condition,
            notes,
            createdAt: new Date().toISOString()
        };
        
        // Agregar a la lista de vehículos
        vehicles.push(vehicle);
        
        // Guardar en localStorage
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        
        // Mostrar mensaje de éxito
        alert(`Vehículo ${brand} ${model} guardado correctamente`);
        
        // Actualizar lista de vehículos
        loadVehicles();
        
        // Reiniciar formulario
        this.reset();
    });

    // Cargar vehículos desde localStorage
    function loadVehicles() {
        const savedVehicles = localStorage.getItem('vehicles');
        if (savedVehicles) {
            vehicles = JSON.parse(savedVehicles);
        }
        
        const vehicleList = document.getElementById('vehicleList');
        const vehicleCount = document.getElementById('vehicleCount');
        const appointmentVehicleSelect = document.getElementById('appointmentVehicle');
        
        vehicleList.innerHTML = '';
        appointmentVehicleSelect.innerHTML = '<option value="">Seleccionar vehículo...</option>';
        
        if (vehicles.length === 0) {
            vehicleList.innerHTML = '<div class="list-group-item text-center text-muted">No hay vehículos registrados</div>';
            vehicleCount.textContent = '0';
            return;
        }
        
        vehicleCount.textContent = vehicles.length;
        
        vehicles.forEach(vehicle => {
            // Agregar a la lista de vehículos
            const vehicleItem = document.createElement('div');
            vehicleItem.className = 'list-group-item vehicle-item';
            vehicleItem.dataset.vehicleId = vehicle.id;
            vehicleItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="vehicle-icon">
                        <i class="bi bi-car-front"></i>
                    </div>
                    <div class="vehicle-info">
                        <h6 class="mb-1">${vehicle.brand} ${vehicle.model}</h6>
                        <small class="text-muted">${vehicle.plate} • ${vehicle.year}</small>
                    </div>
                    <div class="vehicle-actions">
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteVehicle('${vehicle.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            vehicleItem.addEventListener('click', function() {
                selectVehicle(vehicle.id);
            });
            
            vehicleList.appendChild(vehicleItem);
            
            // Agregar al selector de vehículos para citas
            const option = document.createElement('option');
            option.value = vehicle.id;
            option.textContent = `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`;
            appointmentVehicleSelect.appendChild(option);
        });
        
        // Seleccionar el primer vehículo por defecto
        if (vehicles.length > 0 && !currentVehicleId) {
            selectVehicle(vehicles[0].id);
        } else if (currentVehicleId) {
            selectVehicle(currentVehicleId);
        }
    }

    function selectVehicle(vehicleId) {
        currentVehicleId = vehicleId;
        
        // Resaltar vehículo seleccionado
        document.querySelectorAll('.vehicle-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.vehicleId === vehicleId) {
                item.classList.add('active');
            }
        });
        
        // Cargar historial de mantenimiento para este vehículo
        loadMaintenanceHistory(vehicleId);
    }

    window.deleteVehicle = function(vehicleId) {
        if (confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
            vehicles = vehicles.filter(v => v.id !== vehicleId);
            localStorage.setItem('vehicles', JSON.stringify(vehicles));
            
            // Si el vehículo eliminado era el seleccionado, seleccionar otro
            if (currentVehicleId === vehicleId) {
                currentVehicleId = vehicles.length > 0 ? vehicles[0].id : null;
            }
            
            loadVehicles();
        }
    };

    function loadMaintenanceHistory(vehicleId) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;
        
        const historyContainer = document.getElementById('maintenanceHistory');
        historyContainer.innerHTML = '';
        
        // Filtrar citas para este vehículo
        const vehicleAppointments = appointments.filter(a => a.vehicleId === vehicleId);
        
        if (vehicleAppointments.length === 0) {
            historyContainer.innerHTML = '<div class="list-group-item text-center text-muted">No hay historial de mantenimiento</div>';
            return;
        }
        
        // Mostrar citas ordenadas por fecha (más reciente primero)
        vehicleAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        vehicleAppointments.forEach(appointment => {
            const historyItem = document.createElement('div');
            historyItem.className = 'list-group-item';
            historyItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${getAppointmentTypeName(appointment.type)}</h6>
                    <small>${formatDate(appointment.date)}</small>
                </div>
                <p class="mb-1">Taller: ${appointment.location}</p>
                ${appointment.notes ? `<small>Notas: ${appointment.notes}</small>` : ''}
            `;
            historyContainer.appendChild(historyItem);
        });
    }

    function getAppointmentTypeName(type) {
        const types = {
            'mantenimiento': 'Mantenimiento regular',
            'reparacion': 'Reparación',
            'lavado': 'Lavado y detailing',
            'inspeccion': 'Inspección técnica',
            'otros': 'Otros servicios'
        };
        return types[type] || type;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    // Cargar citas desde localStorage
    function loadAppointments() {
        const savedAppointments = localStorage.getItem('appointments');
        if (savedAppointments) {
            appointments = JSON.parse(savedAppointments);
        }
    }

    // Actualizar lista de eventos próximos
    function updateUpcomingEvents() {
        const upcomingEventsContainer = document.getElementById('upcomingEvents');
        upcomingEventsContainer.innerHTML = '';
        
        if (appointments.length === 0) {
            upcomingEventsContainer.innerHTML = '<div class="list-group-item text-center text-muted">No hay eventos próximos</div>';
            return;
        }
        
        // Filtrar citas futuras y ordenar por fecha
        const now = new Date();
        const futureAppointments = appointments
            .filter(a => new Date(a.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (futureAppointments.length === 0) {
            upcomingEventsContainer.innerHTML = '<div class="list-group-item text-center text-muted">No hay eventos próximos</div>';
            return;
        }
        
        // Mostrar las próximas 5 citas
        futureAppointments.slice(0, 5).forEach(appointment => {
            const eventItem = document.createElement('div');
            eventItem.className = 'list-group-item upcoming-event';
            eventItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${getAppointmentTypeName(appointment.type)}</h6>
                    <small class="text-muted">${formatDate(appointment.date)} - ${appointment.time}</small>
                </div>
                <p class="mb-1">Taller: ${appointment.location}</p>
                <small class="text-muted">Vehículo: ${appointment.vehicleName}</small>
            `;
            upcomingEventsContainer.appendChild(eventItem);
        });
    }

    // Manejo de contactos de emergencia
    function loadEmergencyContacts() {
        const savedContacts = localStorage.getItem('emergencyContacts');
        if (savedContacts) {
            emergencyContacts = JSON.parse(savedContacts);
        }
        
        const contactsContainer = document.getElementById('customEmergencyList');
        contactsContainer.innerHTML = '';
        
        if (emergencyContacts.length === 0) {
            contactsContainer.innerHTML = '<div class="list-group-item text-center text-muted">No has agregado contactos personalizados</div>';
            return;
        }
        
        emergencyContacts.forEach(contact => {
            const contactItem = document.createElement('div');
            contactItem.className = 'list-group-item';
            contactItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <i class="bi bi-person-fill" style="font-size: 1.5rem;"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${contact.name}</h6>
                        <small class="text-muted">${getContactTypeName(contact.type)}</small>
                    </div>
                    <div>
                        <a href="tel:${contact.phone}" class="btn btn-sm btn-outline-primary me-2">
                            <i class="bi bi-telephone"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteEmergencyContact('${contact.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                ${contact.notes ? `<div class="mt-2"><small>${contact.notes}</small></div>` : ''}
            `;
            contactsContainer.appendChild(contactItem);
        });
    }

    function getContactTypeName(type) {
        const types = {
            'mecanico': 'Mecánico de confianza',
            'seguro': 'Seguro del vehículo',
            'familiar': 'Familiar',
            'amigo': 'Amigo',
            'otro': 'Otro contacto'
        };
        return types[type] || type;
    }

    window.saveEmergencyContact = function() {
        const name = document.getElementById('contactName').value;
        const phone = document.getElementById('contactPhone').value;
        const type = document.getElementById('contactType').value;
        const notes = document.getElementById('contactNotes').value;
        
        if (!name || !phone) {
            alert('Por favor completa al menos el nombre y teléfono');
            return;
        }
        
        const contact = {
            id: Date.now().toString(),
            name,
            phone,
            type,
            notes,
            createdAt: new Date().toISOString()
        };
        
        emergencyContacts.push(contact);
        localStorage.setItem('emergencyContacts', JSON.stringify(emergencyContacts));
        
        // Cerrar modal y actualizar lista
        bootstrap.Modal.getInstance(document.getElementById('addEmergencyModal')).hide();
        loadEmergencyContacts();
        
        // Limpiar formulario
        document.getElementById('emergencyContactForm').reset();
    };

    window.deleteEmergencyContact = function(contactId) {
        if (confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
            emergencyContacts = emergencyContacts.filter(c => c.id !== contactId);
            localStorage.setItem('emergencyContacts', JSON.stringify(emergencyContacts));
            loadEmergencyContacts();
        }
    };

    // Carrito de compras
    const cartItems = [];
    
    document.querySelectorAll('.card-footer button').forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.card');
            const title = card.querySelector('.card-title').textContent;
            const priceText = card.querySelector('h5').textContent;
            const price = parseFloat(priceText.replace('$', ''));
            
            // Verificar si el producto ya está en el carrito
            const existingItem = cartItems.find(item => item.title === title);
            
            if(existingItem) {
                existingItem.quantity++;
            } else {
                cartItems.push({
                    title: title,
                    price: price,
                    quantity: 1
                });
            }
            
            updateCart();
        });
    });
    
    function updateCart() {
        const cartTable = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if(cartItems.length === 0) {
            cartTable.innerHTML = '<tr><td colspan="5" class="text-center">No hay productos en el carrito</td></tr>';
            cartTotal.textContent = '$0.00';
            checkoutBtn.disabled = true;
            return;
        }
        
        cartTable.innerHTML = '';
        let total = 0;
        
        cartItems.forEach((item, index) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.title}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <div class="input-group input-group-sm" style="width: 100px;">
                        <button class="btn btn-outline-secondary minus-btn" type="button" data-index="${index}">-</button>
                        <input type="text" class="form-control text-center quantity-input" value="${item.quantity}" readonly>
                        <button class="btn btn-outline-secondary plus-btn" type="button" data-index="${index}">+</button>
                    </div>
                </td>
                <td>$${subtotal.toFixed(2)}</td>
                <td><button class="btn btn-sm btn-outline-danger remove-btn" data-index="${index}"><i class="bi bi-trash"></i></button></td>
            `;
            cartTable.appendChild(row);
        });
        
        // Agregar eventos a los botones
        document.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                if(cartItems[index].quantity > 1) {
                    cartItems[index].quantity--;
                    updateCart();
                }
            });
        });
        
        document.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                cartItems[index].quantity++;
                updateCart();
            });
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                cartItems.splice(index, 1);
                updateCart();
            });
        });
        
        cartTotal.textContent = `$${total.toFixed(2)}`;
        checkoutBtn.disabled = false;
    }

    // Inicialización
    loadVehicles();
    loadEmergencyContacts();
    loadAppointments();
});