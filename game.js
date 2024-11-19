      // Oyun durumu
      const gameState = {
        player: {
            name: '',
            level: 1,
            xp: 0,
            xpNeeded: 100,
            health: 100,
            maxHealth: 100,
            strength: 15,
            gold: 0,
            x: 0,
            y: 0
        },
        map: {
            size: 10,
            revealed: new Set(),
            enemies: new Map()
        }
    };

    // Düşman tipleri
    const enemies = [
        { name: "İskelet Savaşçı", health: 30, damage: 5, xp: 25, gold: "5-15" },
        { name: "Goblin Yağmacı", health: 20, damage: 8, xp: 20, gold: "3-12" },
        { name: "Karanlık Büyücü", health: 40, damage: 12, xp: 35, gold: "10-20" },
        { name: "Zehirli Örümcek", health: 25, damage: 6, xp: 15, gold: "4-10" },
        { name: "Lanetli Ruh", health: 35, damage: 10, xp: 30, gold: "8-18" }
    ];

    // Harita sembolleri
    const mapSymbols = {
        player: "P",
        empty: "·",
        unknown: "█",
        enemy: "E"
    };

    function initializeMap() {
        // Rastgele düşmanları yerleştir
        for (let i = 0; i < 15; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * gameState.map.size);
                y = Math.floor(Math.random() * gameState.map.size);
            } while (gameState.map.enemies.has(`${x},${y}`));
            
            const enemy = enemies[Math.floor(Math.random() * enemies.length)];
            gameState.map.enemies.set(`${x},${y}`, {...enemy});
        }
        updateMap();
    }

    function updateMap() {
        let mapDisplay = "";
        for (let y = 0; y < gameState.map.size; y++) {
            for (let x = 0; x < gameState.map.size; x++) {
                const pos = `${x},${y}`;
                if (x === gameState.player.x && y === gameState.player.y) {
                    mapDisplay += mapSymbols.player;
                } else if (gameState.map.revealed.has(pos)) {
                    mapDisplay += gameState.map.enemies.has(pos) ? mapSymbols.enemy : mapSymbols.empty;
                } else {
                    mapDisplay += mapSymbols.unknown;
                }
                mapDisplay += " ";
            }
            mapDisplay += "\n";
        }
        document.getElementById('map-display').textContent = mapDisplay;
    }

    function revealNearby() {
        const x = gameState.player.x;
        const y = gameState.player.y;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newX = x + dx;
                const newY = y + dy;
                if (newX >= 0 && newX < gameState.map.size && 
                    newY >= 0 && newY < gameState.map.size) {
                    gameState.map.revealed.add(`${newX},${newY}`);
                }
            }
        }
    }

    function move(direction) {
        const directions = {
            north: [0, -1],
            south: [0, 1],
            east: [1, 0],
            west: [-1, 0]
        };

        const [dx, dy] = directions[direction];
        const newX = gameState.player.x + dx;
        const newY = gameState.player.y + dy;

        if (newX >= 0 && newX < gameState.map.size && 
            newY >= 0 && newY < gameState.map.size) {
            gameState.player.x = newX;
            gameState.player.y = newY;
            document.getElementById('location').textContent = `${newX},${newY}`;
            
            revealNearby();
            updateMap();
            
            const pos = `${newX},${newY}`;
            if (gameState.map.enemies.has(pos)) {
                const enemy = gameState.map.enemies.get(pos);
                writeToLog(`<span class="combat-text">Bir ${enemy.name} ile karşılaştın!</span>`);
                fight(enemy);
                gameState.map.enemies.delete(pos);
                updateMap();
            } else {
                writeToLog(`<span class="location-text">Yeni konuma hareket ettin (${newX},${newY})</span>`);
            }
        } else {
            writeToLog("Bu yöne gidemezsin!");
        }
    }

    function addXP(amount) {
        gameState.player.xp += amount;
        
        // XP bar'ını güncelle
        const xpPercentage = (gameState.player.xp / gameState.player.xpNeeded) * 100;
        const xpBar = document.getElementById('xp-bar');
        xpBar.style.width = `${Math.min(xpPercentage, 100)}%`;
        xpBar.innerHTML = `%${Math.floor(xpPercentage)}`;
        
        if (gameState.player.xp >= gameState.player.xpNeeded) {
            levelUp();
        }
    }

    function levelUp() {
        gameState.player.level++;
        gameState.player.xp -= gameState.player.xpNeeded;
        gameState.player.xpNeeded = Math.floor(gameState.player.xpNeeded * 1.5);
        gameState.player.maxHealth += 20;
        gameState.player.health = gameState.player.maxHealth;
        gameState.player.strength += 5;

        // Stats'ları güncelle
        document.getElementById('level').textContent = gameState.player.level;
        document.getElementById('health').textContent = gameState.player.health;
        document.getElementById('max-health').textContent = gameState.player.maxHealth;
        document.getElementById('strength').textContent = gameState.player.strength;

        // XP bar'ını yeni seviye için güncelle
        const newXpPercentage = (gameState.player.xp / gameState.player.xpNeeded) * 100;
        const xpBar = document.getElementById('xp-bar');
        xpBar.style.width = `${Math.min(newXpPercentage, 100)}%`;
        xpBar.innerHTML = `%${Math.floor(newXpPercentage)}`;

        // Level up konfetileri
        confetti({
            particleCount: 200,
            spread: 160,
            origin: { y: 0.6 },
            colors: ['#90EE90', '#98FB98', '#32CD32']
        });

        writeToLog(`<span class="level-up-text">Seviye atladın! Artık ${gameState.player.level}. seviyedesin!</span>`);
    }

    function fight(enemy) {
        // Zar atışları
        const playerRoll = rollDice(20);
        const enemyRoll = rollDice(20);
        
        // Hasar hesaplamaları
        const enemyDamage = Math.floor((enemyRoll / 20) * enemy.damage) + 1;
        const playerDamage = Math.floor((playerRoll / 20) * gameState.player.strength) + 1;
        
        // Zar animasyonunu göster
        showDiceAnimation('player', playerRoll, () => {
            showDiceAnimation('enemy', enemyRoll, () => {
                // Savaş sonuçlarını uygula
                gameState.player.health -= enemyDamage;
                document.getElementById('health').textContent = gameState.player.health;

                const [minGold, maxGold] = enemy.gold.split('-').map(Number);
                const goldEarned = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
                gameState.player.gold += goldEarned;
                document.getElementById('gold').textContent = gameState.player.gold;

                writeToLog(`<span class="combat-text">Savaş sonucu:</span>`);
                writeToLog(`<span class="combat-text">Senin zarın: ${playerRoll} (${playerDamage} hasar)</span>`);
                writeToLog(`<span class="combat-text">Düşmanın zarı: ${enemyRoll} (${enemyDamage} hasar)</span>`);
                writeToLog(`<span class="combat-text">- ${enemyDamage} hasar aldın</span>`);
                writeToLog(`<span class="combat-text">- Düşmana ${playerDamage} hasar verdin</span>`);
                writeToLog(`<span class="loot-text">+ ${goldEarned} altın kazandın</span>`);
                writeToLog(`<span class="loot-text">+ ${enemy.xp} tecrübe puanı kazandın</span>`);

                // Zafer konfetileri
                fireConfetti();

                addXP(enemy.xp);

                if (gameState.player.health <= 0) {
                    writeToLog('<span class="combat-text">ÖLDÜN! Oyun yeniden başlıyor...</span>');
                    resetGame();
                }
            });
        });
    }

    // Konfeti efekti için yeni fonksiyon
    function fireConfetti() {
        // Sol taraftan konfeti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: 0.1, y: 0.6 }
        });

        // Sağ taraftan konfeti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: 0.9, y: 0.6 }
        });

        // Orta kısımdan altın renkli konfeti
        confetti({
            particleCount: 50,
            spread: 90,
            origin: { y: 0.7 },
            colors: ['#FFD700', '#FFA500', '#FF8C00']
        });

        // Yavaş dşen konfetiler
        setTimeout(() => {
            confetti({
                particleCount: 30,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                gravity: 0.5
            });
            confetti({
                particleCount: 30,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                gravity: 0.5
            });
        }, 200);
    }

    function resetGame() {
        gameState.player = {
            name: '',
            level: 1,
            xp: 0,
            xpNeeded: 100,
            health: 100,
            maxHealth: 100,
            strength: 15,
            gold: 0,
            x: 0,
            y: 0
        };
        
        updateStats();
        gameState.map.enemies.clear();
        gameState.map.revealed.clear();
        initializeMap();
    }

    function updateStats() {
        document.getElementById('level').textContent = gameState.player.level;
        document.getElementById('xp').textContent = gameState.player.xp;
        document.getElementById('xp-needed').textContent = gameState.player.xpNeeded;
        document.getElementById('health').textContent = gameState.player.health;
        document.getElementById('max-health').textContent = gameState.player.maxHealth;
        document.getElementById('strength').textContent = gameState.player.strength;
        document.getElementById('gold').textContent = gameState.player.gold;
        document.getElementById('location').textContent = `${gameState.player.x},${gameState.player.y}`;
    }

    // Mevcut komut işleme fonksiyonunu güncelle
    function processCommand() {
        const command = playerInput.value.toLowerCase();
        playerInput.value = '';

        switch(command) {
            case 'help':
                writeToLog('Kullanılabilir komutlar:');
                writeToLog('- look: Etrafı kontrol et');
                writeToLog('- north: Kuzeye git');
                writeToLog('- south: Güneye git');
                writeToLog('- east: Doğuya git');
                writeToLog('- west: Batıya git');
                writeToLog('- stats: Karakter durumunu göster');
                break;
                
            case 'north':
            case 'south':
            case 'east':
            case 'west':
                move(command);
                break;

            case 'look':
                const pos = `${gameState.player.x},${gameState.player.y}`;
                if (gameState.map.enemies.has(pos)) {
                    const enemy = gameState.map.enemies.get(pos);
                    writeToLog(`<span class="combat-text">Dikkatli ol! Burada bir ${enemy.name} var!</span>`);
                } else {
                    writeToLog('<span class="location-text">Etraf sakin görünüyor.</span>');
                }
                break;

            case 'stats':
                writeToLog(`İsim: ${gameState.player.name}`);
                writeToLog(`Seviye: ${gameState.player.level}`);
                writeToLog(`XP: ${gameState.player.xp}/${gameState.player.xpNeeded}`);
                writeToLog(`Can: ${gameState.player.health}/${gameState.player.maxHealth}`);
                writeToLog(`Güç: ${gameState.player.strength}`);
                writeToLog(`Altın: ${gameState.player.gold}`);
                break;

            default:
                writeToLog('Geçersiz komut. Yardım için "help" yazın.');
        }
    }

    function writeToLog(message) {
        gameLog.innerHTML += `<p>${message}</p>`;
        gameLog.scrollTop = gameLog.scrollHeight;
    }

    // Oyunu başlat
    const gameLog = document.getElementById('game-log');
    const playerInput = document.getElementById('player-input');

    writeToLog('<span style="color: #ffd700">Ancient Realms\'e Hoş Geldiniz!</span>');
    writeToLog('Komutlar için "help" yazın.');
    
    initializeMap();
    revealNearby();

    playerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processCommand();
        }
    });

    function rollDice(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    function showDiceAnimation(who, result, callback) {
        // Zar animasyonu için geçici div oluştur
        const diceDiv = document.createElement('div');
        diceDiv.className = 'dice-animation';
        diceDiv.style.position = 'fixed';
        diceDiv.style.left = '50%';
        diceDiv.style.top = '50%';
        diceDiv.style.transform = 'translate(-50%, -50%)';
        diceDiv.style.fontSize = '48px';
        diceDiv.style.fontWeight = 'bold';
        diceDiv.style.color = who === 'player' ? '#4a5' : '#f45';
        document.body.appendChild(diceDiv);

        // Animasyon için sayıları değiştir
        let frames = 0;
        const animate = () => {
            frames++;
            if (frames < 20) {
                diceDiv.textContent = Math.floor(Math.random() * 20) + 1;
                requestAnimationFrame(animate);
            } else {
                diceDiv.textContent = result;
                setTimeout(() => {
                    diceDiv.remove();
                    if (callback) callback();
                }, 1000);
            }
        };
        animate();
    }

    // CSS eklemeleri için style tag'ine ekle
    const style = document.createElement('style');
    style.textContent = `
        @keyframes diceRoll {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .dice-animation {
            animation: diceRoll 0.5s ease-out;
            z-index: 1000;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
    `;
    document.head.appendChild(style);

    // Sayfa yüklendiğinde modalı göster
    document.addEventListener('DOMContentLoaded', function() {
        const characterModal = new bootstrap.Modal(document.getElementById('characterModal'));
        characterModal.show();
    });

    // Oyunu başlat
    function startGame() {
        const nameInput = document.getElementById('characterName');
        const name = nameInput.value.trim();
        
        if (name.length < 1) {
            alert('Lütfen bir karakter adı girin!');
            return;
        }
        
        gameState.player.name = name;
        document.getElementById('char-name').textContent = name;
        
        // Modalı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('characterModal'));
        modal.hide();
        
        // Oyunu başlat
        initializeMap();
        writeToLog(`<span style="color: #ffd700">Hoş geldin, ${name}! Ancient Realms'deki macerana başlayabilirsin.</span>`);
        writeToLog('Komutlar için "help" yazın.');
    }