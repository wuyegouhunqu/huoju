// ========================================
// 扭蛋机功能模块 - 修复版
// ========================================

let gachaState = {
    currentPool: null,
    targetQiling: null,
    drawMode: 'single',
    targetLevel: 1,
    simTargetQiling: null,
    
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
    consecutiveNonTargetLegendary: 0,
    simConsecutiveNonTargetLegendary: 0
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

function getQilingImageExtension(qilingName) {
    const jpgImages = ['皎月化身', '药仙子'];
    if (jpgImages.includes(qilingName)) {
        return 'jpg';
    }
    return 'webp';
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
        img.src = `契灵/图片/${getQilingImageName(qiling.契灵名称)}.${getQilingImageExtension(qiling.契灵名称)}`;
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
    const legendaryQilings = pool.契灵列表.filter(q => q.品质 === '传奇' && q.出率 > 0);
    const totalLegendaryProb = legendaryQilings.reduce((sum, q) => sum + q.出率, 0);
    const targetProbInLegendary = targetQiling.出率 / totalLegendaryProb;
    
    const expectedLegendaryDraws = 39.6;
    const hasDiscount = pool['10连抽优惠'].说明 === '10连抽消耗8个契灵结晶';
    
    let singleDrawCost = 1;
    let tenDrawCost = hasDiscount ? 8 : 10;
    
    let expectedDraws;
    let totalCrystals;
    
    if (drawMode === 'single') {
        expectedDraws = Math.ceil(qilingNeeded / targetProbInLegendary * expectedLegendaryDraws);
        totalCrystals = expectedDraws * singleDrawCost;
    } else {
        expectedDraws = Math.ceil(qilingNeeded / targetProbInLegendary * expectedLegendaryDraws / 10);
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

function populateSimTargetQilingList(pool) {
    const container = document.getElementById('gacha-sim-target-select');
    const placeholder = document.getElementById('gacha-sim-target-placeholder');
    
    if (!container || !placeholder) return;
    
    if (!pool) {
        container.style.display = 'none';
        placeholder.style.display = 'block';
        placeholder.textContent = '请先选择奖池';
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'block';
    placeholder.style.display = 'none';
    
    const legendaryQilings = pool.契灵列表.filter(q => q.品质 === '传奇');
    
    if (legendaryQilings.length === 0) {
        placeholder.style.display = 'block';
        placeholder.textContent = '该卡池无传奇契灵';
        container.style.display = 'none';
        return;
    }
    
    legendaryQilings.forEach(qiling => {
        const div = document.createElement('div');
        div.className = 'target-qiling-option';
        if (gachaState.simTargetQiling === qiling.契灵名称) {
            div.classList.add('selected');
        }
        
        const img = document.createElement('img');
        img.src = `契灵/图片/${getQilingImageName(qiling.契灵名称)}.${getQilingImageExtension(qiling.契灵名称)}`;
        img.onerror = function() {
            this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect fill="%23ddd" width="40" height="40" rx="8"/></svg>';
        };
        
        const info = document.createElement('div');
        info.className = 'qiling-info';
        
        const name = document.createElement('div');
        name.className = 'qiling-name';
        name.textContent = qiling.契灵名称;
        
        const rarity = document.createElement('div');
        rarity.className = `qiling-rarity ${qiling.品质.toLowerCase()}`;
        rarity.textContent = qiling.品质;
        
        info.appendChild(name);
        info.appendChild(rarity);
        
        div.appendChild(img);
        div.appendChild(info);
        
        div.addEventListener('click', function() {
            document.querySelectorAll('#gacha-sim-target-select .target-qiling-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            gachaState.simTargetQiling = qiling.契灵名称;
            gachaState.simConsecutiveNonTargetLegendary = 0;
        });
        
        container.appendChild(div);
    });
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
            poolSelect.dispatchEvent(new Event('change'));
        }
        
        poolSelect.addEventListener('change', function() {
            const poolIndex = this.value;
            if (poolIndex) {
                const pool = qilingPoolData.奖池列表[parseInt(poolIndex)];
                populateSimTargetQilingList(pool);
            } else {
                populateSimTargetQilingList(null);
            }
            gachaState.simTargetQiling = null;
            gachaState.simConsecutiveNonTargetLegendary = 0;
        });
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
    
    const legendaryQilings = pool.契灵列表.filter(q => q.品质 === '传奇' && q.出率 > 0);
    const rareQilings = pool.契灵列表.filter(q => q.品质 === '稀有' && q.出率 > 0);
    const magicQilings = pool.契灵列表.filter(q => q.品质 === '魔法' && q.出率 > 0);
    
    const probabilityBoostDesc = pool.概率提升.说明;
    let hasProbabilityBoost = false;
    let requiredLegendaryCount = 0;
    
    if (probabilityBoostDesc === '每获得2个传奇契灵，至少1个指定契灵') {
        hasProbabilityBoost = true;
        requiredLegendaryCount = 2;
    } else if (probabilityBoostDesc === '每获得4个传奇契灵，至少1个指定契灵') {
        hasProbabilityBoost = true;
        requiredLegendaryCount = 4;
    }
    
    const isSimMode = !!document.getElementById('gacha-simulation');
    const targetQilingName = isSimMode ? gachaState.simTargetQiling : gachaState.targetQiling;
    
    let legendaryProb;
    let forceLegendary = false;
    
    if (gachaState.pityCount <= 50) {
        legendaryProb = 0.015 * Math.pow(0.985, gachaState.pityCount - 1);
    } else if (gachaState.pityCount <= 115) {
        legendaryProb = 0.015 * (gachaState.pityCount - 49);
    } else {
        legendaryProb = 1;
        forceLegendary = true;
        console.log('保底机制触发：第116抽，本次必定获得传奇契灵！');
    }
    
    if (legendaryProb >= 1) {
        legendaryProb = 1;
        forceLegendary = true;
    }
    
    const rareProb = 0.12;
    const magicProb = 1 - legendaryProb - rareProb;
    
    const rand = Math.random();
    let quality;
    let targetQilings;
    
    if (forceLegendary) {
        quality = '传奇';
        targetQilings = legendaryQilings;
        gachaState.consecutiveMagicCount = 0;
    } else if (gachaState.consecutiveMagicCount >= 9) {
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
    
    console.log(`第${gachaState.pityCount}抽 - 传奇概率: ${(legendaryProb * 100).toFixed(4)}%, 稀有概率: 12.0000%, 魔法概率: ${(magicProb * 100).toFixed(4)}%, 随机数: ${rand.toFixed(6)}, 抽中: ${quality}`);
    
    let selectedQiling;
    if (quality === '传奇' && hasProbabilityBoost && targetQilingName) {
        const consecutiveNonTarget = isSimMode ? gachaState.simConsecutiveNonTargetLegendary : gachaState.consecutiveNonTargetLegendary;
        const threshold = requiredLegendaryCount - 1;
        
        if (consecutiveNonTarget >= threshold) {
            console.log(`触发每${requiredLegendaryCount}个传奇至少1个指定的机制：连续${threshold}个非目标传奇，本次必须是目标`);
            selectedQiling = targetQilings.find(q => q.契灵名称 === targetQilingName);
            if (!selectedQiling) {
                selectedQiling = targetQilings[0];
            }
            if (isSimMode) {
                gachaState.simConsecutiveNonTargetLegendary = 0;
            } else {
                gachaState.consecutiveNonTargetLegendary = 0;
            }
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
                if (isSimMode) {
                    gachaState.simConsecutiveNonTargetLegendary++;
                    console.log(`抽卡模拟连续非目标传奇次数：${gachaState.simConsecutiveNonTargetLegendary}`);
                } else {
                    gachaState.consecutiveNonTargetLegendary++;
                    console.log(`成本计算连续非目标传奇次数：${gachaState.consecutiveNonTargetLegendary}`);
                }
            } else {
                if (isSimMode) {
                    gachaState.simConsecutiveNonTargetLegendary = 0;
                } else {
                    gachaState.consecutiveNonTargetLegendary = 0;
                }
            }
        }
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
    }
    
    const result = {
        品质: quality,
        契灵名称: selectedQiling.契灵名称,
        出率: selectedQiling.出率
    };
    
    console.log(`抽中契灵: ${result.契灵名称} (${result.品质})`);
    if (result.品质 === '传奇') {
        console.log(`🎉 获得传奇！保底计数重置为0`);
    }
    
    return result;
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
        img.src = `契灵/图片/${getQilingImageName(result.契灵名称)}.${getQilingImageExtension(result.契灵名称)}`;
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
        img.src = `契灵/图片/${getQilingImageName(item.契灵名称)}.${getQilingImageExtension(item.契灵名称)}`;
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
        img.src = `契灵/图片/${getQilingImageName(result.契灵名称)}.${getQilingImageExtension(result.契灵名称)}`;
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
    gachaState.simTargetQiling = null;
    gachaState.simConsecutiveNonTargetLegendary = 0;
    
    const targetSelect = document.getElementById('gacha-sim-target-select');
    if (targetSelect) {
        targetSelect.querySelectorAll('.target-qiling-option').forEach(o => o.classList.remove('selected'));
    }
    
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

function runGachaSimulationTest(poolIndex, targetQilingName, totalDraws) {
    const pool = qilingPoolData.奖池列表[poolIndex];
    if (!pool) {
        console.error('找不到指定的卡池！');
        return;
    }
    
    console.log(`\n========================================`);
    console.log(`开始抽卡模拟测试 - 卡池：${pool.奖池名称}`);
    console.log(`目标契灵：${targetQilingName || '无'}`);
    console.log(`模拟次数：${totalDraws.toLocaleString()}`);
    console.log(`========================================\n`);
    
    const legendaryQilings = pool.契灵列表.filter(q => q.品质 === '传奇');
    const baseLegendaryProb = legendaryQilings.reduce((sum, q) => sum + q.出率, 0);
    const probabilityBoostDesc = pool.概率提升.说明;
    
    console.log(`卡池基础信息：`);
    console.log(`  - 基础传奇概率：${(baseLegendaryProb * 100).toFixed(3)}%`);
    console.log(`  - 概率提升规则：${probabilityBoostDesc}`);
    console.log(`  - 传奇契灵数量：${legendaryQilings.length}`);
    
    let testState = {
        totalDraws: 0,
        legendaryCount: 0,
        rareCount: 0,
        magicCount: 0,
        pityCount: 0,
        consecutiveMagicCount: 0,
        consecutiveNonTargetLegendary: 0,
        maxPityReached: 0,
        drawResults: []
    };
    
    const startTime = Date.now();
    
    for (let i = 0; i < totalDraws; i++) {
        testState.pityCount++;
        testState.totalDraws++;
        
        let pityBonus = 0;
        if (testState.pityCount > 50) {
            const pityLevel = testState.pityCount - 50;
            pityBonus = pityLevel * 0.015;
            if (testState.pityCount > testState.maxPityReached) {
                testState.maxPityReached = testState.pityCount;
            }
        }
        
        const rareQilings = pool.契灵列表.filter(q => q.品质 === '稀有');
        const magicQilings = pool.契灵列表.filter(q => q.品质 === '魔法');
        
        let legendaryProb = baseLegendaryProb + pityBonus;
        let forceLegendary = false;
        
        if (legendaryProb >= 1) {
            legendaryProb = 1;
            forceLegendary = true;
        }
        
        let rareProb = rareQilings.reduce((sum, q) => sum + q.出率, 0);
        let magicProb = 1 - legendaryProb - rareProb;
        
        const rand = Math.random();
        let quality;
        let targetQilings;
        
        if (forceLegendary) {
            quality = '传奇';
            targetQilings = legendaryQilings;
            testState.consecutiveMagicCount = 0;
        } else if (testState.consecutiveMagicCount >= 9) {
            const rareOrLegendaryRand = Math.random();
            const totalRareLegendaryProb = legendaryProb + rareProb;
            if (rareOrLegendaryRand < legendaryProb / totalRareLegendaryProb) {
                quality = '传奇';
                targetQilings = legendaryQilings;
            } else {
                quality = '稀有';
                targetQilings = rareQilings;
            }
            testState.consecutiveMagicCount = 0;
        } else {
            if (rand < legendaryProb) {
                quality = '传奇';
                targetQilings = legendaryQilings;
                testState.consecutiveMagicCount = 0;
            } else if (rand < legendaryProb + rareProb) {
                quality = '稀有';
                targetQilings = rareQilings;
                testState.consecutiveMagicCount = 0;
            } else {
                quality = '魔法';
                targetQilings = magicQilings;
                testState.consecutiveMagicCount++;
            }
        }
        
        let selectedQiling;
        
        if (quality === '传奇' && targetQilingName) {
            let hasProbabilityBoost = false;
            let requiredLegendaryCount = 0;
            
            if (probabilityBoostDesc === '每获得2个传奇契灵，至少1个指定契灵') {
                hasProbabilityBoost = true;
                requiredLegendaryCount = 2;
            } else if (probabilityBoostDesc === '每获得4个传奇契灵，至少1个指定契灵') {
                hasProbabilityBoost = true;
                requiredLegendaryCount = 4;
            }
            
            if (hasProbabilityBoost) {
                const threshold = requiredLegendaryCount - 1;
                
                if (testState.consecutiveNonTargetLegendary >= threshold) {
                    selectedQiling = targetQilings.find(q => q.契灵名称 === targetQilingName);
                    if (!selectedQiling) {
                        selectedQiling = targetQilings[0];
                    }
                    testState.consecutiveNonTargetLegendary = 0;
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
                        testState.consecutiveNonTargetLegendary++;
                    } else {
                        testState.consecutiveNonTargetLegendary = 0;
                    }
                }
            }
        }
        
        if (!selectedQiling) {
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
        }
        
        testState.drawResults.push({
            quality: quality,
            qiling: selectedQiling
        });
        
        if (quality === '传奇') {
            testState.legendaryCount++;
            testState.pityCount = 0;
        } else if (quality === '稀有') {
            testState.rareCount++;
        } else {
            testState.magicCount++;
        }
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n模拟完成！耗时：${duration.toFixed(2)}秒\n`);
    console.log(`========================================`);
    console.log(`统计结果：`);
    console.log(`  - 总抽数：${testState.totalDraws.toLocaleString()}`);
    console.log(`  - 传奇契灵：${testState.legendaryCount.toLocaleString()} (${(testState.legendaryCount / testState.totalDraws * 100).toFixed(3)}%)`);
    console.log(`  - 稀有契灵：${testState.rareCount.toLocaleString()} (${(testState.rareCount / testState.totalDraws * 100).toFixed(3)}%)`);
    console.log(`  - 魔法契灵：${testState.magicCount.toLocaleString()} (${(testState.magicCount / testState.totalDraws * 100).toFixed(3)}%)`);
    console.log(`  - 最高连续无传奇：${testState.maxPityReached}抽`);
    
    if (targetQilingName) {
        const targetCount = testState.drawResults.filter(r => r.quality === '传奇' && r.qiling.契灵名称 === targetQilingName).length;
        console.log(`  - 目标契灵【${targetQilingName}】：${targetCount.toLocaleString()} (${(targetCount / testState.legendaryCount * 100).toFixed(2)}% 传奇)`);
    }
    
    console.log(`========================================\n`);
    
    return testState;
}

function randomGachaTest() {
    const randomPoolIndices = [];
    const poolCount = qilingPoolData.奖池列表.length;
    
    while (randomPoolIndices.length < 3) {
        const randomIndex = Math.floor(Math.random() * poolCount);
        if (!randomPoolIndices.includes(randomIndex)) {
            randomPoolIndices.push(randomIndex);
        }
    }
    
    console.log('随机选择的3个卡池索引：', randomPoolIndices);
    
    randomPoolIndices.forEach((poolIndex, i) => {
        const pool = qilingPoolData.奖池列表[poolIndex];
        const legendaryQilings = pool.契灵列表.filter(q => q.品质 === '传奇');
        const targetQiling = legendaryQilings.length > 0 ? legendaryQilings[0].契灵名称 : null;
        
        console.log(`\n===== 测试 ${i + 1} =====`);
        runGachaSimulationTest(poolIndex, targetQiling, 100000);
    });
}

window.randomGachaTest = randomGachaTest;
window.runGachaSimulationTest = runGachaSimulationTest;

function runDetailedBatchTest() {
    console.log('\n========================================');
    console.log('开始批量抽卡详细测试');
    console.log('测试目标：验证多个卡池各1万次抽卡的概率');
    console.log('========================================\n');
    
    const testPools = [
        { name: '猫团酷送', index: null, targetQiling: '酷猫宅急送' },
        { name: '如我梦中', index: null, targetQiling: '牧灵人' },
        { name: '黑潮盛宴', index: null, targetQiling: null }
    ];
    
    testPools.forEach(poolInfo => {
        poolInfo.index = qilingPoolData.奖池列表.findIndex(p => p.奖池名称 === poolInfo.name);
    });
    
    testPools.forEach((poolInfo, i) => {
        if (poolInfo.index === -1) {
            console.log(`❌ 找不到卡池：${poolInfo.name}`);
            return;
        }
        
        const pool = qilingPoolData.奖池列表[poolInfo.index];
        const legendaryQilings = pool.契灵列表.filter(q => q.品质 === '传奇' && q.出率 > 0);
        const baseLegendaryProb = legendaryQilings.reduce((sum, q) => sum + q.出率, 0);
        
        console.log(`\n===== 测试 ${i + 1}：${poolInfo.name} =====`);
        console.log('卡池基础信息：');
        console.log(`  - 基础传奇概率：${(baseLegendaryProb * 100).toFixed(3)}%`);
        console.log(`  - 概率提升规则：${pool.概率提升.说明}`);
        console.log(`  - 传奇契灵列表：`);
        legendaryQilings.forEach(q => {
            console.log(`    - ${q.契灵名称}：${(q.出率 * 100).toFixed(3)}%`);
        });
        
        let targetQilingName = poolInfo.targetQiling;
        if (!targetQilingName && legendaryQilings.length > 0) {
            targetQilingName = legendaryQilings[0].契灵名称;
        }
        
        if (targetQilingName) {
            console.log(`  - 目标契灵：${targetQilingName}`);
        }
        
        console.log('\n开始10,000次抽卡模拟...\n');
        
        let testState = {
            totalDraws: 0,
            legendaryCount: 0,
            rareCount: 0,
            magicCount: 0,
            pityCount: 0,
            consecutiveMagicCount: 0,
            consecutiveNonTargetLegendary: 0,
            maxPityReached: 0,
            drawResults: []
        };
        
        const startTime = Date.now();
        const isSimMode = false;
        const probabilityBoostDesc = pool.概率提升.说明;
        let hasProbabilityBoost = false;
        let requiredLegendaryCount = 0;
        
        if (probabilityBoostDesc === '每获得2个传奇契灵，至少1个指定契灵') {
            hasProbabilityBoost = true;
            requiredLegendaryCount = 2;
        } else if (probabilityBoostDesc === '每获得4个传奇契灵，至少1个指定契灵') {
            hasProbabilityBoost = true;
            requiredLegendaryCount = 4;
        }
        
        for (let drawNum = 1; drawNum <= 10000; drawNum++) {
            testState.pityCount++;
            testState.totalDraws++;
            
            const rareQilings = pool.契灵列表.filter(q => q.品质 === '稀有' && q.出率 > 0);
            const magicQilings = pool.契灵列表.filter(q => q.品质 === '魔法' && q.出率 > 0);
            
            let pityBonus = 0;
            if (testState.pityCount > 50) {
                const pityLevel = testState.pityCount - 50;
                pityBonus = pityLevel * 0.015;
                if (testState.pityCount > testState.maxPityReached) {
                    testState.maxPityReached = testState.pityCount;
                }
            }
            
            let legendaryProb = baseLegendaryProb + pityBonus;
            let forceLegendary = false;
            
            if (legendaryProb >= 1) {
                legendaryProb = 1;
                forceLegendary = true;
            }
            
            let rareProb = rareQilings.reduce((sum, q) => sum + q.出率, 0);
            let magicProb = 1 - legendaryProb - rareProb;
            
            const rand = Math.random();
            let quality;
            let targetQilings;
            
            if (forceLegendary) {
                quality = '传奇';
                targetQilings = legendaryQilings;
                testState.consecutiveMagicCount = 0;
            } else if (testState.consecutiveMagicCount >= 9) {
                const rareOrLegendaryRand = Math.random();
                const totalRareLegendaryProb = legendaryProb + rareProb;
                if (rareOrLegendaryRand < legendaryProb / totalRareLegendaryProb) {
                    quality = '传奇';
                    targetQilings = legendaryQilings;
                } else {
                    quality = '稀有';
                    targetQilings = rareQilings;
                }
                testState.consecutiveMagicCount = 0;
            } else {
                if (rand < legendaryProb) {
                    quality = '传奇';
                    targetQilings = legendaryQilings;
                    testState.consecutiveMagicCount = 0;
                } else if (rand < legendaryProb + rareProb) {
                    quality = '稀有';
                    targetQilings = rareQilings;
                    testState.consecutiveMagicCount = 0;
                } else {
                    quality = '魔法';
                    targetQilings = magicQilings;
                    testState.consecutiveMagicCount++;
                }
            }
            
            let selectedQiling;
            
            if (quality === '传奇' && hasProbabilityBoost && targetQilingName) {
                const threshold = requiredLegendaryCount - 1;
                
                if (testState.consecutiveNonTargetLegendary >= threshold) {
                    selectedQiling = targetQilings.find(q => q.契灵名称 === targetQilingName);
                    if (!selectedQiling) {
                        selectedQiling = targetQilings[0];
                    }
                    testState.consecutiveNonTargetLegendary = 0;
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
                        testState.consecutiveNonTargetLegendary++;
                    } else {
                        testState.consecutiveNonTargetLegendary = 0;
                    }
                }
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
            }
            
            const result = {
                quality: quality,
                qiling: selectedQiling
            };
            
            testState.drawResults.push(result);
            
            if (quality === '传奇') {
                testState.legendaryCount++;
                testState.pityCount = 0;
            } else if (quality === '稀有') {
                testState.rareCount++;
            } else {
                testState.magicCount++;
            }
            
            if (drawNum % 1000 === 0) {
                console.log(`进度：${drawNum.toLocaleString()} / 10,000 (${(drawNum / 100).toFixed(0)}%)`);
            }
        }
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log('\n========================================');
        console.log(`${poolInfo.name} - 测试结果`);
        console.log('========================================');
        console.log(`  - 测试耗时：${duration.toFixed(2)}秒`);
        console.log(`  - 总抽数：${testState.totalDraws.toLocaleString()}`);
        console.log(`  - 传奇契灵：${testState.legendaryCount.toLocaleString()} (${(testState.legendaryCount / testState.totalDraws * 100).toFixed(3)}%)`);
        console.log(`  - 稀有契灵：${testState.rareCount.toLocaleString()} (${(testState.rareCount / testState.totalDraws * 100).toFixed(3)}%)`);
        console.log(`  - 魔法契灵：${testState.magicCount.toLocaleString()} (${(testState.magicCount / testState.totalDraws * 100).toFixed(3)}%)`);
        console.log(`  - 最高连续无传奇：${testState.maxPityReached}抽`);
        
        if (targetQilingName) {
            const targetCount = testState.drawResults.filter(r => r.quality === '传奇' && r.qiling.契灵名称 === targetQilingName).length;
            console.log(`  - 目标契灵【${targetQilingName}】：${targetCount.toLocaleString()} (${(targetCount / testState.legendaryCount * 100).toFixed(2)}% 传奇)`);
        }
        
        const legendaryDiff = ((testState.legendaryCount / testState.totalDraws - baseLegendaryProb) / baseLegendaryProb * 100);
        console.log(`  - 传奇概率偏差：${legendaryDiff >= 0 ? '+' : ''}${legendaryDiff.toFixed(2)}%`);
        
        if (Math.abs(legendaryDiff) < 5) {
            console.log('  ✅ 传奇概率符合预期（偏差 < 5%）');
        } else if (Math.abs(legendaryDiff) < 10) {
            console.log('  ⚠️  传奇概率略有偏差（5% ≤ 偏差 < 10%）');
        } else {
            console.log('  ❌ 传奇概率偏差较大（偏差 ≥ 10%）');
        }
        
        console.log('========================================\n');
    });
    
    console.log('所有卡池测试完成！');
}

window.runDetailedBatchTest = runDetailedBatchTest;
