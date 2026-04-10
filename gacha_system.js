// ========================================
// 扭蛋机功能模块 - 修复版
// ========================================

let gachaState = {
    currentPool: null,
    targetQiling: null,
    drawMode: 'single',
    targetLevel: 1,
    
    totalDraws: 0,
    legendaryCount: 0,
    rareCount: 0,
    magicCount: 0,
    drawHistory: [],
    collection: {},
    pityCount: 0,
    hasSelection: false,
    selectedQilings: [],
    nonTargetLegendaryCount: 0,
    initialized: false,
    consecutiveMagicCount: 0,
    consecutiveNonTargetLegendary: 0
};

function getQilingImageName(qilingName) {
    let imageName = qilingName;
    
    const nameMap = {
        '多多・多萝西': '多多·多萝西',
        '多多·多萝西': '多多·多萝西',
        '怒海大幅-寂夜': '怒海大副-寂夜',
        '怒海大副-寂夜': '怒海大副-寂夜',
        '鸟窝头头': '鸟窝头',
        '探险小獭-攀岩': '探险小獭-攀岩',
        '探险小獭-磐岩': '探险小獭-攀岩',
        '小灯笼-烛光': '小灯龙-烛光',
        '小灯龙-烛光': '小灯龙-烛光',
        '小灯笼-幽光': '小灯龙-幽光',
        '小灯龙-幽光': '小灯龙-幽光',
        '小灯笼-萤光': '小灯龙-萤光',
        '小灯龙-萤光': '小灯龙-萤光',
        '小灯笼-极光': '小灯龙-极光',
        '小灯龙-极光': '小灯龙-极光',
        '采云者-穹苍': '采云者-苍穹'
    };
    
    if (nameMap[imageName]) {
        imageName = nameMap[imageName];
    }
    
    imageName = imageName.replace('・', '·');
    
    return imageName;
}

function initializeGachaSystem() {
    console.log('========== 初始化扭蛋机系统 ==========');
    
    // 检查数据
    if (typeof qilingPoolData === 'undefined') {
        console.error('✗ 契灵卡池数据未加载！');
        return;
    }
    
    console.log(`✓ 找到 ${qilingPoolData.奖池列表.length} 个奖池`);
    
    setTimeout(() => {
        setupGachaSubTabs();
        initializeCostCalculation();
        initializeSimulation();
        gachaState.initialized = true;
        console.log('========== 扭蛋机系统初始化完成 ==========');
    }, 100);
}

function setupGachaSubTabs() {
    const subTabs = document.querySelectorAll('.gacha-sub-tab');
    const contents = document.querySelectorAll('.gacha-content');
    
    console.log('找到子标签页数量:', subTabs.length);
    
    // 使用命名函数并移除旧监听器
    subTabs.forEach(tab => {
        // 移除旧的点击事件监听器
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
    });
    
    // 重新获取元素并添加监听器
    const newSubTabs = document.querySelectorAll('.gacha-sub-tab');
    const newContents = document.querySelectorAll('.gacha-content');
    
    newSubTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.dataset.tab;
            console.log('点击子标签:', target);
            
            newSubTabs.forEach(t => t.classList.remove('active'));
            newContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const targetContent = document.getElementById(`gacha-${target}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function initializeCostCalculation() {
    const poolSelect = document.getElementById('gacha-pool-select');
    const qilingSelect = document.getElementById('gacha-qiling-select');
    const calculateBtn = document.getElementById('gacha-calculate-btn');
    
    console.log('初始化成本计算 - poolSelect:', !!poolSelect);
    
    if (!poolSelect) {
        console.warn('成本计算奖池选择器未找到！');
        return;
    }
    
    populatePoolList(poolSelect);
    
    poolSelect.addEventListener('change', function() {
        populateTargetQilingList(this.value, qilingSelect);
    });
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateCost);
    }
    
    if (poolSelect.options.length > 1) {
        poolSelect.value = poolSelect.options[1].value;
        populateTargetQilingList(poolSelect.value, qilingSelect);
    }
}

function populatePoolList(selectElement) {
    selectElement.innerHTML = '<option value="">请选择奖池</option>';
    
    if (typeof qilingPoolData === 'undefined' || !qilingPoolData.奖池列表) {
        console.error('奖池数据未定义！');
        return;
    }
    
    qilingPoolData.奖池列表.forEach((pool, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = pool.奖池名称;
        selectElement.appendChild(option);
    });
    
    console.log('填充奖池列表完成，数量:', qilingPoolData.奖池列表.length);
}

function populateTargetQilingList(poolIndex, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (poolIndex === '' || poolIndex === null || poolIndex === undefined) {
        return;
    }
    
    const pool = qilingPoolData.奖池列表[parseInt(poolIndex)];
    if (!pool) {
        console.error('奖池不存在:', poolIndex);
        return;
    }
    
    const legendaryQilings = pool.契灵列表.filter(q => q.品质 === '传奇');
    console.log('找到传奇契灵数量:', legendaryQilings.length);
    
    legendaryQilings.forEach(qiling => {
        const div = document.createElement('div');
        div.className = 'target-qiling-option';
        div.dataset.name = qiling.契灵名称;
        
        const img = document.createElement('img');
        img.src = `契灵/图片/${getQilingImageName(qiling.契灵名称)}.webp`;
        img.onerror = function() {
            this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect fill="%23ddd" width="40" height="40" rx="8"/></svg>';
        };
        
        const info = document.createElement('div');
        info.className = 'qiling-info';
        
        const name = document.createElement('div');
        name.className = 'qiling-name';
        name.textContent = qiling.契灵名称;
        
        const rarity = document.createElement('div');
        rarity.className = 'qiling-rarity legendary';
        rarity.textContent = '传奇';
        
        info.appendChild(name);
        info.appendChild(rarity);
        
        div.appendChild(img);
        div.appendChild(info);
        
        div.addEventListener('click', function() {
            document.querySelectorAll('.target-qiling-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            gachaState.targetQiling = qiling.契灵名称;
        });
        
        container.appendChild(div);
    });
}

function calculateCost() {
    const poolIndex = document.getElementById('gacha-pool-select')?.value;
    const targetLevel = parseInt(document.getElementById('gacha-level-select')?.value) || 1;
    const drawMode = document.getElementById('gacha-cost-mode')?.value || 'single';
    
    if (!poolIndex || !gachaState.targetQiling) {
        alert('请选择奖池和目标契灵！');
        return;
    }
    
    const pool = qilingPoolData.奖池列表[parseInt(poolIndex)];
    const targetQiling = pool.契灵列表.find(q => q.契灵名称 === gachaState.targetQiling);
    
    if (!targetQiling) {
        alert('未找到目标契灵！');
        return;
    }
    
    const qilingNeeded = targetLevel;
    const legendaryBaseProb = targetQiling.出率;
    const hasDiscount = pool['10连抽优惠'].说明 === '10连抽消耗8个契灵结晶';
    
    let singleDrawCost = 1;
    let tenDrawCost = hasDiscount ? 8 : 10;
    
    let expectedDraws;
    let totalCrystals;
    
    if (drawMode === 'single') {
        expectedDraws = Math.ceil(qilingNeeded / legendaryBaseProb);
        totalCrystals = expectedDraws * singleDrawCost;
    } else {
        expectedDraws = Math.ceil(qilingNeeded / (legendaryBaseProb * 10));
        totalCrystals = expectedDraws * tenDrawCost;
    }
    
    const totalFragments = totalCrystals * 160;
    const totalRMB = totalFragments / 10;
    
    const resultContainer = document.getElementById('gacha-cost-result');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <h3><i class="fas fa-calculator"></i> 期望成本计算</h3>
            <div class="cost-result-grid">
                <div class="cost-result-item">
                    <div class="result-label">期望抽取次数</div>
                    <div class="result-value">${expectedDraws.toLocaleString()}</div>
                    <div class="result-unit">${drawMode === 'single' ? '次单抽' : '次10连抽'}</div>
                </div>
                <div class="cost-result-item">
                    <div class="result-label">契灵结晶消耗</div>
                    <div class="result-value">${totalCrystals.toLocaleString()}</div>
                    <div class="result-unit">个</div>
                </div>
                <div class="cost-result-item">
                    <div class="result-label">碎裂原晶消耗</div>
                    <div class="result-value">${totalFragments.toLocaleString()}</div>
                    <div class="result-unit">个</div>
                </div>
                <div class="cost-result-item">
                    <div class="result-label">期望花费</div>
                    <div class="result-value">${totalRMB.toFixed(0)}</div>
                    <div class="result-unit">元</div>
                </div>
            </div>
        `;
        resultContainer.style.display = 'block';
    }
}

function initializeSimulation() {
    const poolSelect = document.getElementById('gacha-sim-pool-select');
    const singleBtn = document.getElementById('gacha-draw-single');
    const tenBtn = document.getElementById('gacha-draw-ten');
    const drawBtn = document.getElementById('gacha-draw-btn');
    const resetBtn = document.getElementById('gacha-reset-btn');
    
    console.log('初始化抽卡模拟 - poolSelect:', !!poolSelect);
    
    if (poolSelect) {
        populatePoolList(poolSelect);
        if (poolSelect.options.length > 1) {
            poolSelect.value = poolSelect.options[1].value;
        }
    }
    
    if (singleBtn) {
        singleBtn.addEventListener('click', function() {
            document.querySelectorAll('.draw-mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gachaState.drawMode = 'single';
        });
    }
    
    if (tenBtn) {
        tenBtn.addEventListener('click', function() {
            document.querySelectorAll('.draw-mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gachaState.drawMode = 'ten';
        });
    }
    
    if (drawBtn) {
        drawBtn.addEventListener('click', performDraw);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSimulation);
    }
}

function performDraw() {
    const poolSelect = document.getElementById('gacha-sim-pool-select');
    const poolIndex = poolSelect?.value;
    
    if (!poolIndex) {
        alert('请选择奖池！');
        return;
    }
    
    const pool = qilingPoolData.奖池列表[parseInt(poolIndex)];
    const drawCount = gachaState.drawMode === 'single' ? 1 : 10;
    
    const results = [];
    
    for (let i = 0; i < drawCount; i++) {
        const result = drawSingle(pool);
        results.push(result);
        
        gachaState.totalDraws++;
        
        if (result.品质 === '传奇') {
            gachaState.legendaryCount++;
            gachaState.pityCount = 0;
        } else if (result.品质 === '稀有') {
            gachaState.rareCount++;
        } else {
            gachaState.magicCount++;
        }
        
        if (!gachaState.collection[result.契灵名称]) {
            gachaState.collection[result.契灵名称] = {
                ...result,
                level: 1,
                count: 1
            };
        } else {
            gachaState.collection[result.契灵名称].count++;
            if (gachaState.collection[result.契灵名称].level < 6) {
                gachaState.collection[result.契灵名称].level++;
            }
        }
    }
    
    updateStatsUI();
    updateDrawLog(results);
    updateCollectionUI();
    showDrawAnimation(results);
}

function drawSingle(pool) {
    gachaState.pityCount++;
    let pityBonus = 0;
    
    if (gachaState.pityCount >= 50) {
        const pityLevel = gachaState.pityCount - 50;
        pityBonus = pityLevel * 0.015;
    }
    
    const legendaryQilings = pool.契灵列表.filter(q => q.品质 === '传奇');
    const rareQilings = pool.契灵列表.filter(q => q.品质 === '稀有');
    const magicQilings = pool.契灵列表.filter(q => q.品质 === '魔法');
    
    const hasProbabilityBoost = pool.概率提升.说明 === '每获得2个传奇契灵，至少1个指定契灵';
    const targetQilingName = gachaState.targetQiling;
    
    let legendaryProb = legendaryQilings.reduce((sum, q) => sum + q.出率, 0) + pityBonus;
    let rareProb = rareQilings.reduce((sum, q) => sum + q.出率, 0);
    let magicProb = 1 - legendaryProb - rareProb;
    
    const rand = Math.random();
    let quality;
    let targetQilings;
    
    if (gachaState.consecutiveMagicCount >= 9) {
        console.log('触发10连抽保底机制：连续9次魔法，本次必须是稀有或传奇');
        const rareOrLegendaryRand = Math.random();
        const totalRareLegendaryProb = legendaryProb + rareProb;
        if (rareOrLegendaryRand < legendaryProb / totalRareLegendaryProb) {
            quality = '传奇';
            targetQilings = legendaryQilings;
        } else {
            quality = '稀有';
            targetQilings = rareQilings;
        }
        gachaState.consecutiveMagicCount = 0;
    } else {
        if (rand < legendaryProb) {
            quality = '传奇';
            targetQilings = legendaryQilings;
            gachaState.consecutiveMagicCount = 0;
        } else if (rand < legendaryProb + rareProb) {
            quality = '稀有';
            targetQilings = rareQilings;
            gachaState.consecutiveMagicCount = 0;
        } else {
            quality = '魔法';
            targetQilings = magicQilings;
            gachaState.consecutiveMagicCount++;
            console.log(`连续魔法次数：${gachaState.consecutiveMagicCount}`);
        }
    }
    
    let selectedQiling;
    if (quality === '传奇' && hasProbabilityBoost && targetQilingName) {
        if (gachaState.consecutiveNonTargetLegendary >= 1) {
            console.log('触发每2个传奇至少1个指定的机制：连续1个非目标传奇，本次必须是目标');
            selectedQiling = targetQilings.find(q => q.契灵名称 === targetQilingName);
            if (!selectedQiling) {
                selectedQiling = targetQilings[0];
            }
            gachaState.consecutiveNonTargetLegendary = 0;
        } else {
            const targetRand = Math.random();
            let targetCumulative = 0;
            let totalTargetProb = targetQilings.reduce((sum, q) => sum + q.出率, 0);
            
            for (const qiling of targetQilings) {
                targetCumulative += qiling.出率 / totalTargetProb;
                if (targetRand <= targetCumulative) {
                    selectedQiling = qiling;
                    break;
                }
            }
            
            if (!selectedQiling) {
                selectedQiling = targetQilings[0];
            }
            
            if (selectedQiling.契灵名称 !== targetQilingName) {
                gachaState.consecutiveNonTargetLegendary++;
                console.log(`连续非目标传奇次数：${gachaState.consecutiveNonTargetLegendary}`);
            } else {
                gachaState.consecutiveNonTargetLegendary = 0;
            }
        }
    } else {
        const targetRand = Math.random();
        let targetCumulative = 0;
        let totalTargetProb = targetQilings.reduce((sum, q) => sum + q.出率, 0);
        
        for (const qiling of targetQilings) {
            targetCumulative += qiling.出率 / totalTargetProb;
            if (targetRand <= targetCumulative) {
                return qiling;
            }
        }
        
        return targetQilings[0];
    }
    
    return selectedQiling;
}

function updateStatsUI() {
    const totalEl = document.querySelector('.gacha-stat-item.total .stat-value');
    const legendaryEl = document.querySelector('.gacha-stat-item.legendary .stat-value');
    const rareEl = document.querySelector('.gacha-stat-item.rare .stat-value');
    const magicEl = document.querySelector('.gacha-stat-item.magic .stat-value');
    
    if (totalEl) totalEl.textContent = gachaState.totalDraws;
    if (legendaryEl) legendaryEl.textContent = gachaState.legendaryCount;
    if (rareEl) rareEl.textContent = gachaState.rareCount;
    if (magicEl) magicEl.textContent = gachaState.magicCount;
}

function updateDrawLog(results) {
    const logContainer = document.getElementById('gacha-draw-log');
    if (!logContainer) return;
    
    const header = logContainer.querySelector('h3');
    logContainer.innerHTML = '';
    if (header) logContainer.appendChild(header);
    
    results.forEach((result, index) => {
        const item = document.createElement('div');
        item.className = 'gacha-log-item';
        
        const img = document.createElement('img');
        img.src = `契灵/图片/${getQilingImageName(result.契灵名称)}.webp`;
        img.onerror = function() {
            this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect fill="%23ddd" width="40" height="40" rx="8"/></svg>';
        };
        
        const info = document.createElement('div');
        info.className = 'log-info';
        
        const name = document.createElement('div');
        name.className = 'log-name';
        name.textContent = result.契灵名称;
        
        const meta = document.createElement('div');
        meta.className = 'log-meta';
        
        const rarity = document.createElement('span');
        rarity.className = `log-rarity ${result.品质 === '传奇' ? 'legendary' : result.品质 === '稀有' ? 'rare' : 'magic'}`;
        rarity.textContent = result.品质;
        
        const idx = document.createElement('span');
        idx.className = 'log-index';
        idx.textContent = `#${gachaState.totalDraws - results.length + index + 1}`;
        
        meta.appendChild(rarity);
        meta.appendChild(idx);
        
        info.appendChild(name);
        info.appendChild(meta);
        
        item.appendChild(img);
        item.appendChild(info);
        
        logContainer.appendChild(item);
    });
}

function updateCollectionUI() {
    const container = document.getElementById('gacha-collection-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(gachaState.collection).sort((a, b) => {
        const order = { '传奇': 0, '稀有': 1, '魔法': 2 };
        return order[a.品质] - order[b.品质];
    }).forEach(item => {
        const div = document.createElement('div');
        div.className = `gacha-collection-item ${item.品质 === '传奇' ? 'legendary' : item.品质 === '稀有' ? 'rare' : 'magic'}`;
        
        const img = document.createElement('img');
        img.src = `契灵/图片/${getQilingImageName(item.契灵名称)}.webp`;
        img.onerror = function() {
            this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%23ddd" width="80" height="80" rx="10"/></svg>';
        };
        
        const name = document.createElement('div');
        name.className = 'collection-name';
        name.textContent = item.契灵名称;
        
        const level = document.createElement('div');
        level.className = 'collection-level';
        
        const badge = document.createElement('span');
        badge.className = 'collection-level-badge';
        badge.textContent = `Lv.${item.level}`;
        
        level.appendChild(badge);
        
        div.appendChild(img);
        div.appendChild(name);
        div.appendChild(level);
        
        container.appendChild(div);
    });
}

function showDrawAnimation(results) {
    const overlay = document.getElementById('gacha-animation-overlay');
    const container = document.getElementById('gacha-animation-cards');
    const closeBtn = document.getElementById('gacha-animation-close');
    
    if (!overlay || !container) return;
    
    container.innerHTML = '';
    container.className = results.length > 1 ? 'gacha-multi-cards' : '';
    
    results.forEach((result, index) => {
        const card = document.createElement('div');
        card.className = `gacha-card ${result.品质 === '传奇' ? 'legendary' : result.品质 === '稀有' ? 'rare' : 'magic'}`;
        
        const cardBack = document.createElement('div');
        cardBack.className = 'gacha-card-back';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'gacha-card-front';
        
        const inner = document.createElement('div');
        inner.className = 'gacha-card-inner';
        
        const glow = document.createElement('div');
        glow.className = 'gacha-glow';
        
        const img = document.createElement('img');
        img.className = 'gacha-card-image';
        img.src = `契灵/图片/${getQilingImageName(result.契灵名称)}.webp`;
        img.onerror = function() {
            this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect fill="%23ddd" width="150" height="150" rx="15"/></svg>';
        };
        
        const name = document.createElement('div');
        name.className = 'gacha-card-name';
        name.textContent = result.契灵名称;
        
        const rarity = document.createElement('div');
        rarity.className = 'gacha-card-rarity';
        rarity.textContent = result.品质;
        
        inner.appendChild(glow);
        inner.appendChild(img);
        inner.appendChild(name);
        inner.appendChild(rarity);
        
        cardFront.appendChild(inner);
        
        card.appendChild(cardBack);
        card.appendChild(cardFront);
        container.appendChild(card);
        
        setTimeout(() => {
            card.classList.add('animate');
        }, index * 333);
    });
    
    overlay.classList.add('active');
    
    // 点击关闭按钮关闭
    if (closeBtn) {
        closeBtn.onclick = () => {
            overlay.classList.remove('active');
        };
    }
    
    // 点击空白位置关闭
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    };
}

function resetSimulation() {
    gachaState.totalDraws = 0;
    gachaState.legendaryCount = 0;
    gachaState.rareCount = 0;
    gachaState.magicCount = 0;
    gachaState.drawHistory = [];
    gachaState.collection = {};
    gachaState.pityCount = 0;
    gachaState.consecutiveMagicCount = 0;
    gachaState.consecutiveNonTargetLegendary = 0;
    
    updateStatsUI();
    
    const logContainer = document.getElementById('gacha-draw-log');
    if (logContainer) {
        const header = logContainer.querySelector('h3');
        logContainer.innerHTML = '';
        if (header) logContainer.appendChild(header);
    }
    
    const collectionGrid = document.getElementById('gacha-collection-grid');
    if (collectionGrid) {
        collectionGrid.innerHTML = '';
    }
}

window.initializeGachaSystem = initializeGachaSystem;
