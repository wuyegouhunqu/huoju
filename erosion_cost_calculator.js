// ==========================================
// 侵蚀成本计算器 - 完整实现（包含高级模式）
// ==========================================

class ErosionCostCalculator {
    constructor() {
        this.currentMode = 'basic';
        this.targets = [];
        this.targetIdCounter = 0;
        this.STORAGE_KEY = 'erosion_calculator_data';
        this.loadFromStorage();
        this.initEventListeners();
    }

    initEventListeners() {
        const calculateBtn = document.getElementById('calculate-erosion-cost-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateBasicMode());
        }

        const modeToggleBtn = document.getElementById('mode-toggle-btn');
        if (modeToggleBtn) {
            modeToggleBtn.addEventListener('click', () => this.toggleMode());
        }

        const addTargetBtn = document.getElementById('add-target-btn');
        if (addTargetBtn) {
            addTargetBtn.addEventListener('click', () => this.addTarget());
        }

        const calculateArbitrageBtn = document.getElementById('calculate-arbitrage-btn');
        if (calculateArbitrageBtn) {
            calculateArbitrageBtn.addEventListener('click', () => this.calculateAdvancedMode());
        }

        const equipmentAffixCountAdvanced = document.getElementById('equipment-affix-count-advanced');
        if (equipmentAffixCountAdvanced) {
            equipmentAffixCountAdvanced.addEventListener('change', () => this.updateAffixOptions());
        }

        const saveConfigBtn = document.getElementById('save-config-btn');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => this.saveConfig());
        }

        const loadConfigSelect = document.getElementById('load-config-select');
        if (loadConfigSelect) {
            loadConfigSelect.addEventListener('change', (e) => this.loadConfig(e.target.value));
        }

        const deleteConfigBtn = document.getElementById('delete-config-btn');
        if (deleteConfigBtn) {
            deleteConfigBtn.addEventListener('click', () => this.deleteConfig());
        }

        this.loadConfigsList();

        const inputIds = [
            'equipment-level-erosion', 'equipment-price', 'dark-core-price', 'demon-core-price', 'equipment-affix-count',
            'equipment-level-erosion-advanced', 'equipment-price-advanced', 'dark-core-price-advanced', 
            'demon-core-price-advanced', 'equipment-affix-count-advanced', 'include-fee',
            'mutation-price', 'non-target-price'
        ];

        inputIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.saveToStorage());
                element.addEventListener('input', () => this.saveToStorage());
            }
        });
    }

    loadFromStorage() {
        try {
            const storedData = localStorage.getItem(this.STORAGE_KEY);
            if (storedData) {
                const data = JSON.parse(storedData);
                
                if (data.equipmentLevelErosion) {
                    const el = document.getElementById('equipment-level-erosion');
                    if (el) el.value = data.equipmentLevelErosion;
                }
                if (data.equipmentPrice !== undefined) {
                    const el = document.getElementById('equipment-price');
                    if (el) el.value = data.equipmentPrice;
                }
                if (data.darkCorePrice !== undefined) {
                    const el = document.getElementById('dark-core-price');
                    if (el) el.value = data.darkCorePrice;
                }
                if (data.demonCorePrice !== undefined) {
                    const el = document.getElementById('demon-core-price');
                    if (el) el.value = data.demonCorePrice;
                }
                if (data.equipmentAffixCount !== undefined) {
                    const el = document.getElementById('equipment-affix-count');
                    if (el) el.value = data.equipmentAffixCount;
                }
                
                if (data.equipmentLevelErosionAdvanced) {
                    const el = document.getElementById('equipment-level-erosion-advanced');
                    if (el) el.value = data.equipmentLevelErosionAdvanced;
                }
                if (data.equipmentPriceAdvanced !== undefined) {
                    const el = document.getElementById('equipment-price-advanced');
                    if (el) el.value = data.equipmentPriceAdvanced;
                }
                if (data.darkCorePriceAdvanced !== undefined) {
                    const el = document.getElementById('dark-core-price-advanced');
                    if (el) el.value = data.darkCorePriceAdvanced;
                }
                if (data.demonCorePriceAdvanced !== undefined) {
                    const el = document.getElementById('demon-core-price-advanced');
                    if (el) el.value = data.demonCorePriceAdvanced;
                }
                if (data.equipmentAffixCountAdvanced !== undefined) {
                    const el = document.getElementById('equipment-affix-count-advanced');
                    if (el) el.value = data.equipmentAffixCountAdvanced;
                }
                if (data.includeFee !== undefined) {
                    const el = document.getElementById('include-fee');
                    if (el) el.checked = data.includeFee;
                }
                if (data.mutationPrice !== undefined) {
                    const el = document.getElementById('mutation-price');
                    if (el) el.value = data.mutationPrice;
                }
                if (data.nonTargetPrice !== undefined) {
                    const el = document.getElementById('non-target-price');
                    if (el) el.value = data.nonTargetPrice;
                }

                if (data.currentMode) {
                    this.currentMode = data.currentMode;
                }
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
    }

    saveToStorage() {
        try {
            const data = {
                currentMode: this.currentMode,
                equipmentLevelErosion: document.getElementById('equipment-level-erosion')?.value,
                equipmentPrice: parseFloat(document.getElementById('equipment-price')?.value) || 0,
                darkCorePrice: parseFloat(document.getElementById('dark-core-price')?.value) || 0,
                demonCorePrice: parseFloat(document.getElementById('demon-core-price')?.value) || 0,
                equipmentAffixCount: parseInt(document.getElementById('equipment-affix-count')?.value) || 4,
                equipmentLevelErosionAdvanced: document.getElementById('equipment-level-erosion-advanced')?.value,
                equipmentPriceAdvanced: parseFloat(document.getElementById('equipment-price-advanced')?.value) || 0,
                darkCorePriceAdvanced: parseFloat(document.getElementById('dark-core-price-advanced')?.value) || 0,
                demonCorePriceAdvanced: parseFloat(document.getElementById('demon-core-price-advanced')?.value) || 0,
                equipmentAffixCountAdvanced: parseInt(document.getElementById('equipment-affix-count-advanced')?.value) || 6,
                includeFee: document.getElementById('include-fee')?.checked,
                mutationPrice: parseFloat(document.getElementById('mutation-price')?.value) || 0,
                nonTargetPrice: parseFloat(document.getElementById('non-target-price')?.value) || 0
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to storage:', e);
        }
    }

    toggleMode() {
        const newMode = this.currentMode === 'basic' ? 'advanced' : 'basic';
        this.switchMode(newMode);
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        const modeToggleBtn = document.getElementById('mode-toggle-btn');
        const modeLabels = document.querySelectorAll('.mode-label');
        const basicModeSection = document.getElementById('basic-mode-section');
        const advancedModeSection = document.getElementById('advanced-mode-section');
        const basicResultsSection = document.getElementById('basic-results-section');
        const advancedResultsSection = document.getElementById('advanced-results-section');

        if (mode === 'basic') {
            modeToggleBtn.classList.remove('active');
            modeLabels[0].classList.add('active');
            modeLabels[1].classList.remove('active');
            basicModeSection.style.display = 'block';
            advancedModeSection.style.display = 'none';
            basicResultsSection.style.display = 'block';
            advancedResultsSection.style.display = 'none';
        } else {
            modeToggleBtn.classList.add('active');
            modeLabels[0].classList.remove('active');
            modeLabels[1].classList.add('active');
            basicModeSection.style.display = 'none';
            advancedModeSection.style.display = 'block';
            basicResultsSection.style.display = 'none';
            advancedResultsSection.style.display = 'block';
            
            if (this.targets.length === 0) {
                this.addTarget();
            }
        }

        this.saveToStorage();
    }

    addTarget() {
        const targetList = document.getElementById('target-list');
        const targetId = this.targetIdCounter++;
        const affixCount = parseInt(document.getElementById('equipment-affix-count-advanced').value) || 6;
        
        this.targets.push({
            id: targetId,
            type: 'single',
            affix1: 'T1',
            affix2: 'T1',
            remark: '',
            price: 0
        });

        const targetItem = document.createElement('div');
        targetItem.className = 'target-item';
        targetItem.id = `target-${targetId}`;
        
        targetItem.innerHTML = `
            <select class="target-type" data-id="${targetId}">
                <option value="single">单词缀</option>
                <option value="double">双词缀</option>
            </select>
            <div class="affix-select-wrapper" style="display: flex; gap: 4px; width: 100%;">
                <select class="affix1-select" data-id="${targetId}" style="flex: 1;">
                    ${this.generateAffixOptions(affixCount)}
                </select>
                <select class="affix2-select" data-id="${targetId}" style="flex: 1; display: none;">
                    ${this.generateAffixOptions(affixCount)}
                </select>
            </div>
            <input type="number" class="target-price" data-id="${targetId}" placeholder="价格" min="0" step="0.01" value="0">
            <button class="delete-target-btn" data-id="${targetId}" title="删除">
                <i class="fas fa-trash"></i>
            </button>
        `;

        targetList.appendChild(targetItem);

        const typeSelect = targetItem.querySelector('.target-type');
        typeSelect.addEventListener('change', (e) => this.onTargetTypeChange(e));

        const affix1Select = targetItem.querySelector('.affix1-select');
        affix1Select.addEventListener('change', (e) => this.onAffixChange(e));

        const affix2Select = targetItem.querySelector('.affix2-select');
        affix2Select.addEventListener('change', (e) => this.onAffixChange(e));

        const priceInput = targetItem.querySelector('.target-price');
        priceInput.addEventListener('input', (e) => this.onPriceChange(e));

        const deleteBtn = targetItem.querySelector('.delete-target-btn');
        deleteBtn.addEventListener('click', (e) => this.deleteTarget(e));
    }

    generateAffixOptions(count) {
        let options = '';
        for (let i = 1; i <= count; i++) {
            options += `<option value="T${i}">T${i}</option>`;
        }
        return options;
    }

    updateAffixOptions() {
        const affixCount = parseInt(document.getElementById('equipment-affix-count-advanced').value) || 6;
        
        this.targets.forEach(target => {
            const targetItem = document.getElementById(`target-${target.id}`);
            if (targetItem) {
                const affix1Select = targetItem.querySelector('.affix1-select');
                const affix2Select = targetItem.querySelector('.affix2-select');
                
                affix1Select.innerHTML = this.generateAffixOptions(affixCount);
                affix2Select.innerHTML = this.generateAffixOptions(affixCount);
                
                if (target.type === 'single') {
                    target.affix1 = 'T1';
                    affix1Select.value = 'T1';
                } else {
                    target.affix1 = 'T1';
                    target.affix2 = 'T2';
                    affix1Select.value = 'T1';
                    affix2Select.value = 'T2';
                }
            }
        });
    }

    onTargetTypeChange(e) {
        const targetId = parseInt(e.target.dataset.id);
        const target = this.targets.find(t => t.id === targetId);
        if (target) {
            target.type = e.target.value;
            
            const targetItem = document.getElementById(`target-${targetId}`);
            const affix2Select = targetItem.querySelector('.affix2-select');
            
            if (e.target.value === 'double') {
                affix2Select.style.display = 'block';
                target.affix2 = 'T2';
                affix2Select.value = 'T2';
            } else {
                affix2Select.style.display = 'none';
            }
        }
    }

    onAffixChange(e) {
        const targetId = parseInt(e.target.dataset.id);
        const target = this.targets.find(t => t.id === targetId);
        if (target) {
            if (e.target.classList.contains('affix1-select')) {
                target.affix1 = e.target.value;
            } else if (e.target.classList.contains('affix2-select')) {
                target.affix2 = e.target.value;
            }
        }
    }

    onPriceChange(e) {
        const targetId = parseInt(e.target.dataset.id);
        const target = this.targets.find(t => t.id === targetId);
        if (target) {
            target.price = parseFloat(e.target.value) || 0;
        }
    }

    deleteTarget(e) {
        const targetId = parseInt(e.currentTarget.dataset.id);
        this.targets = this.targets.filter(t => t.id !== targetId);
        
        const targetItem = document.getElementById(`target-${targetId}`);
        if (targetItem) {
            targetItem.remove();
        }
    }

    calculateBasicMode() {
        const equipmentLevel = parseInt(document.getElementById('equipment-level-erosion').value);
        const equipmentPrice = parseFloat(document.getElementById('equipment-price').value) || 0;
        const darkCorePrice = parseFloat(document.getElementById('dark-core-price').value) || 0;
        const demonCorePrice = parseFloat(document.getElementById('demon-core-price').value) || 0;
        const equipmentAffixCount = parseInt(document.getElementById('equipment-affix-count').value) || 4;
        const targetUpgradeCount = parseInt(document.getElementById('target-upgrade-count').value);

        const darkResult = this.calculateForType('dark', equipmentLevel, equipmentPrice, darkCorePrice, demonCorePrice, equipmentAffixCount, targetUpgradeCount);
        const deepestResult = this.calculateForType('deepest', equipmentLevel, equipmentPrice, darkCorePrice, demonCorePrice, equipmentAffixCount, targetUpgradeCount);

        this.displayBasicResults(darkResult, deepestResult, targetUpgradeCount);
    }

    calculateForType(type, equipmentLevel, equipmentPrice, darkCorePrice, demonCorePrice, equipmentAffixCount, targetUpgradeCount) {
        const isDark = type === 'dark';
        const successProbability = this.getSuccessProbability(isDark, equipmentAffixCount, targetUpgradeCount);
        
        if (successProbability === 0) {
            return {
                possible: false,
                erosionCount: 0,
                darkCoreCount: 0,
                demonCoreCount: 0,
                equipmentCount: 0,
                totalCost: Infinity,
                successProbability: 0
            };
        }

        const expectedErosionCount = 1 / successProbability;
        const darkCorePerErosion = equipmentLevel >= 82 ? 7 : 4;
        const demonCorePerErosion = 1;

        let darkCoreCount, demonCoreCount;
        if (isDark) {
            darkCoreCount = expectedErosionCount * darkCorePerErosion;
            demonCoreCount = 0;
        } else {
            darkCoreCount = 0;
            demonCoreCount = expectedErosionCount * demonCorePerErosion;
        }

        const equipmentCount = expectedErosionCount;
        const totalCost = (darkCoreCount * darkCorePrice) + (demonCoreCount * demonCorePrice) + (equipmentCount * equipmentPrice);

        return {
            possible: true,
            erosionCount: expectedErosionCount,
            darkCoreCount: darkCoreCount,
            demonCoreCount: demonCoreCount,
            equipmentCount: equipmentCount,
            totalCost: totalCost,
            successProbability: successProbability
        };
    }

    getSuccessProbability(isDark, equipmentAffixCount, targetUpgradeCount) {
        const N = equipmentAffixCount;
        
        if (isDark) {
            if (targetUpgradeCount === 1) {
                const prideProb = 0.30;
                const targetHitProb = 1 / N;
                return prideProb * targetHitProb;
            } else {
                return 0;
            }
        } else {
            if (targetUpgradeCount === 1) {
                const prideProb = 0.15;
                const profaneProb = 0.15;
                
                const prideTargetHitProb = 1 / N;
                const profaneTargetHitProb = 2 / N;
                
                return (prideProb * prideTargetHitProb) + (profaneProb * profaneTargetHitProb);
            } else {
                const profaneProb = 0.15;
                const combinations = N * (N - 1) / 2;
                const targetHitProb = 1 / combinations;
                
                return profaneProb * targetHitProb;
            }
        }
    }

    displayBasicResults(darkResult, deepestResult, targetUpgradeCount) {
        const recommendationSection = document.getElementById('recommendation-section');
        const detailedResults = document.getElementById('detailed-results');
        const recommendationContent = document.getElementById('recommendation-content');
        const darkResultCard = document.getElementById('dark-result-card');
        const deepestResultCard = document.getElementById('deepest-result-card');

        recommendationSection.style.display = 'block';
        detailedResults.style.display = 'block';

        if (darkResult.possible) {
            darkResultCard.style.display = 'block';
        } else {
            darkResultCard.style.display = 'none';
        }

        if (deepestResult.possible) {
            deepestResultCard.style.display = 'block';
        } else {
            deepestResultCard.style.display = 'none';
        }

        this.updateResultCard('dark', darkResult);
        this.updateResultCard('deepest', deepestResult);

        let recommendation = '';
        
        if (targetUpgradeCount === 2) {
            if (deepestResult.possible) {
                const probPercent = (deepestResult.successProbability * 100).toFixed(2);
                recommendation = `
                    <div class="recommendation-item best">
                        <i class="fas fa-check-circle"></i>
                        <span>提升2个词缀<strong>只能使用至暗侵蚀</strong></span>
                    </div>
                    <div class="recommendation-item">
                        <i class="fas fa-info-circle"></i>
                        <span>成功概率：${probPercent}%（亵渎15% × 恰好选中目标2条词缀）</span>
                    </div>
                `;
            } else {
                recommendation = `
                    <div class="recommendation-item warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>无法计算，请检查输入参数</span>
                    </div>
                `;
            }
        } else {
            const possibleOptions = [];
            if (darkResult.possible) possibleOptions.push({ type: 'dark', result: darkResult });
            if (deepestResult.possible) possibleOptions.push({ type: 'deepest', result: deepestResult });

            if (possibleOptions.length > 0) {
                possibleOptions.sort((a, b) => a.result.totalCost - b.result.totalCost);
                const best = possibleOptions[0];
                const bestType = best.type === 'dark' ? '黑暗侵蚀' : '至暗侵蚀';
                const bestProbPercent = (best.result.successProbability * 100).toFixed(2);
                
                recommendation = `
                    <div class="recommendation-item best">
                        <i class="fas fa-star"></i>
                        <span>推荐使用<strong>${bestType}</strong>（成功概率：${bestProbPercent}%）</span>
                    </div>
                `;

                if (possibleOptions.length > 1) {
                    const other = possibleOptions[1];
                    const otherType = other.type === 'dark' ? '黑暗侵蚀' : '至暗侵蚀';
                    const otherProbPercent = (other.result.successProbability * 100).toFixed(2);
                    const costDiff = (other.result.totalCost - best.result.totalCost).toFixed(2);
                    recommendation += `
                        <div class="recommendation-item">
                            <i class="fas fa-info-circle"></i>
                            <span>${otherType}（成功概率：${otherProbPercent}%）会额外花费 ${costDiff} 初火源质</span>
                        </div>
                    `;
                }
            }
        }

        recommendationContent.innerHTML = recommendation;

        if (targetUpgradeCount === 1) {
            if (darkResult.possible && deepestResult.possible) {
                if (darkResult.totalCost < deepestResult.totalCost) {
                    darkResultCard.classList.add('selected');
                    deepestResultCard.classList.remove('selected');
                } else {
                    darkResultCard.classList.remove('selected');
                    deepestResultCard.classList.add('selected');
                }
            } else if (darkResult.possible) {
                darkResultCard.classList.add('selected');
                deepestResultCard.classList.remove('selected');
            } else if (deepestResult.possible) {
                darkResultCard.classList.remove('selected');
                deepestResultCard.classList.add('selected');
            }
        } else {
            darkResultCard.classList.remove('selected');
            deepestResultCard.classList.add('selected');
        }
    }

    updateResultCard(type, result) {
        const prefix = type === 'dark' ? 'dark' : 'deepest';
        
        if (result.possible) {
            const probPercent = (result.successProbability * 100).toFixed(2);
            document.getElementById(`${prefix}-erosion-count`).textContent = result.erosionCount.toFixed(2);
            document.getElementById(`${prefix}-core-count`).textContent = result.darkCoreCount.toFixed(2);
            document.getElementById(`${prefix}-demon-count`).textContent = result.demonCoreCount.toFixed(2);
            document.getElementById(`${prefix}-equipment-count`).textContent = result.equipmentCount.toFixed(2);
            document.getElementById(`${prefix}-total-cost`).textContent = result.totalCost.toFixed(2) + ' 初火源质';
        } else {
            document.getElementById(`${prefix}-erosion-count`).textContent = '不可能';
            document.getElementById(`${prefix}-core-count`).textContent = '-';
            document.getElementById(`${prefix}-demon-count`).textContent = '-';
            document.getElementById(`${prefix}-equipment-count`).textContent = '-';
            document.getElementById(`${prefix}-total-cost`).textContent = '-';
        }
    }

    calculateAdvancedMode() {
        const equipmentLevel = parseInt(document.getElementById('equipment-level-erosion-advanced').value);
        const equipmentPrice = parseFloat(document.getElementById('equipment-price-advanced').value) || 0;
        const darkCorePrice = parseFloat(document.getElementById('dark-core-price-advanced').value) || 0;
        const demonCorePrice = parseFloat(document.getElementById('demon-core-price-advanced').value) || 0;
        const equipmentAffixCount = parseInt(document.getElementById('equipment-affix-count-advanced').value) || 6;
        const includeFee = document.getElementById('include-fee').checked;
        const mutationPrice = parseFloat(document.getElementById('mutation-price').value) || 0;
        const nonTargetPrice = parseFloat(document.getElementById('non-target-price').value) || 0;

        const darkResult = this.calculateArbitrageForType('dark', equipmentLevel, equipmentPrice, darkCorePrice, demonCorePrice, equipmentAffixCount, includeFee, mutationPrice, nonTargetPrice);
        const deepestResult = this.calculateArbitrageForType('deepest', equipmentLevel, equipmentPrice, darkCorePrice, demonCorePrice, equipmentAffixCount, includeFee, mutationPrice, nonTargetPrice);

        this.displayAdvancedResults(darkResult, deepestResult);
    }

    calculateArbitrageForType(type, equipmentLevel, equipmentPrice, darkCorePrice, demonCorePrice, equipmentAffixCount, includeFee, mutationPrice, nonTargetPrice) {
        const isDark = type === 'dark';
        const N = equipmentAffixCount;
        const feeMultiplier = includeFee ? 0.875 : 1;

        const darkCorePerErosion = equipmentLevel >= 82 ? 7 : 4;
        const demonCorePerErosion = 1;

        let singleCost;
        if (isDark) {
            singleCost = equipmentPrice + (darkCorePerErosion * darkCorePrice);
        } else {
            singleCost = equipmentPrice + (demonCorePerErosion * demonCorePrice);
        }

        let expectedRevenue = 0;
        const C2 = N * (N - 1) / 2;

        const singleTargets = this.targets.filter(t => t.type === 'single');
        const doubleTargets = this.targets.filter(t => t.type === 'double');

        if (isDark) {
            const mutationProb = 0.10;
            const chaosProb = 0.30;
            const prideProb = 0.30;
            const voidProb = 0.30;

            expectedRevenue += mutationPrice * feeMultiplier * mutationProb;

            let targetHitTotal = 0;
            singleTargets.forEach(target => {
                const hitProb = 1 / N;
                targetHitTotal += hitProb;
                expectedRevenue += target.price * feeMultiplier * prideProb * hitProb;
            });

            const nonTargetProb = 1 - targetHitTotal;
            expectedRevenue += nonTargetPrice * feeMultiplier * prideProb * nonTargetProb;

        } else {
            const mutationProb = 0.10;
            const chaosProb = 0.30;
            const profaneProb = 0.15;
            const prideProb = 0.15;
            const voidProb = 0.30;

            expectedRevenue += mutationPrice * feeMultiplier * mutationProb;

            let exactDoubleHitProb = 0;
            let exactDoubleRevenue = 0;
            doubleTargets.forEach(target => {
                const hitProb = 1 / C2;
                exactDoubleHitProb += hitProb;
                exactDoubleRevenue += target.price * feeMultiplier * profaneProb * hitProb;
            });

            let partialHitProb = 0;
            let partialHitRevenue = 0;

            if (singleTargets.length > 0) {
                for (let i = 1; i <= N; i++) {
                    for (let j = i + 1; j <= N; j++) {
                        const affixA = `T${i}`;
                        const affixB = `T${j}`;

                        let isExactDouble = false;
                        doubleTargets.forEach(dt => {
                            if ((dt.affix1 === affixA && dt.affix2 === affixB) || 
                                (dt.affix1 === affixB && dt.affix2 === affixA)) {
                                isExactDouble = true;
                            }
                        });

                        if (!isExactDouble) {
                            let matchingSingleTarget = null;
                            let maxPrice = 0;
                            singleTargets.forEach(st => {
                                if (st.affix1 === affixA || st.affix1 === affixB) {
                                    if (st.price > maxPrice) {
                                        maxPrice = st.price;
                                        matchingSingleTarget = st;
                                    }
                                }
                            });

                            if (matchingSingleTarget) {
                                const hitProb = 1 / C2;
                                partialHitProb += hitProb;
                                partialHitRevenue += matchingSingleTarget.price * feeMultiplier * profaneProb * hitProb;
                            }
                        }
                    }
                }
            }

            let remainingProfaneProb = 1 - exactDoubleHitProb - partialHitProb;
            let remainingProfaneRevenue = nonTargetPrice * feeMultiplier * profaneProb * remainingProfaneProb;

            expectedRevenue += exactDoubleRevenue;
            expectedRevenue += partialHitRevenue;
            expectedRevenue += remainingProfaneRevenue;

            let prideTargetHitTotal = 0;
            singleTargets.forEach(target => {
                const hitProb = 1 / N;
                prideTargetHitTotal += hitProb;
                expectedRevenue += target.price * feeMultiplier * prideProb * hitProb;
            });

            let prideNonTargetProb = 1 - prideTargetHitTotal;
            expectedRevenue += nonTargetPrice * feeMultiplier * prideProb * prideNonTargetProb;
        }

        const netProfit = expectedRevenue - singleCost;

        return {
            singleCost: singleCost,
            expectedRevenue: expectedRevenue,
            netProfit: netProfit
        };
    }

    displayAdvancedResults(darkResult, deepestResult) {
        const recommendationSection = document.getElementById('arbitrage-recommendation-section');
        const resultsGrid = document.getElementById('arbitrage-results-grid');

        recommendationSection.style.display = 'block';
        resultsGrid.style.display = 'grid';

        this.updateArbitrageResultCard('dark', darkResult);
        this.updateArbitrageResultCard('deepest', deepestResult);

        const recommendationContent = document.getElementById('arbitrage-recommendation-content');
        let recommendation = '';

        const darkProfit = darkResult.netProfit;
        const deepestProfit = deepestResult.netProfit;

        if (darkProfit > 0 && darkProfit > deepestProfit) {
            recommendation = `
                <div class="recommendation-item best">
                    <i class="fas fa-star"></i>
                    <span>✨ 推荐使用<strong>【黑暗侵蚀】</strong>进行打造。期望单次盈利：${darkProfit.toFixed(2)}</span>
                </div>
            `;
        } else if (deepestProfit > 0 && deepestProfit >= darkProfit) {
            recommendation = `
                <div class="recommendation-item best">
                    <i class="fas fa-star"></i>
                    <span>✨ 推荐使用<strong>【至暗侵蚀】</strong>进行打造。期望单次盈利：${deepestProfit.toFixed(2)}</span>
                </div>
            `;
        } else {
            recommendation = `
                <div class="recommendation-item warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>⚠️ 不推荐打造：两种方式均属于负期望，存在亏损风险，建议直接去交易行购买成品。</span>
                </div>
            `;
        }

        recommendationContent.innerHTML = recommendation;
    }

    updateArbitrageResultCard(type, result) {
        const prefix = type === 'dark' ? 'dark' : 'deepest';
        
        document.getElementById(`arbitrage-${prefix}-single-cost`).textContent = result.singleCost.toFixed(2) + ' 初火源质';
        document.getElementById(`arbitrage-${prefix}-expected-revenue`).textContent = result.expectedRevenue.toFixed(2) + ' 初火源质';
        
        const netProfitElement = document.getElementById(`arbitrage-${prefix}-net-profit`);
        netProfitElement.textContent = result.netProfit.toFixed(2) + ' 初火源质';
        
        if (result.netProfit > 0) {
            netProfitElement.className = 'stat-value positive';
        } else {
            netProfitElement.className = 'stat-value negative';
        }
    }

    getConfigsStorageKey() {
        return 'erosion_calculator_configs';
    }

    loadConfigsList() {
        try {
            const storedConfigs = localStorage.getItem(this.getConfigsStorageKey());
            const configSelect = document.getElementById('load-config-select');
            
            if (configSelect) {
                configSelect.innerHTML = '<option value="">加载配置...</option>';
                
                if (storedConfigs) {
                    const configs = JSON.parse(storedConfigs);
                    Object.keys(configs).sort().forEach(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        configSelect.appendChild(option);
                    });
                }
            }
        } catch (e) {
            console.error('Error loading configs list:', e);
        }
    }

    saveConfig() {
        const configNameInput = document.getElementById('config-name-input');
        const configName = configNameInput?.value.trim();
        
        if (!configName) {
            alert('请输入配置名称');
            return;
        }

        try {
            const storedConfigs = localStorage.getItem(this.getConfigsStorageKey());
            let configs = storedConfigs ? JSON.parse(storedConfigs) : {};

            const config = {
                equipmentLevel: document.getElementById('equipment-level-erosion-advanced')?.value,
                equipmentPrice: parseFloat(document.getElementById('equipment-price-advanced')?.value) || 0,
                darkCorePrice: parseFloat(document.getElementById('dark-core-price-advanced')?.value) || 0,
                demonCorePrice: parseFloat(document.getElementById('demon-core-price-advanced')?.value) || 0,
                equipmentAffixCount: parseInt(document.getElementById('equipment-affix-count-advanced')?.value) || 6,
                includeFee: document.getElementById('include-fee')?.checked,
                mutationPrice: parseFloat(document.getElementById('mutation-price')?.value) || 0,
                nonTargetPrice: parseFloat(document.getElementById('non-target-price')?.value) || 0,
                targets: this.targets.map(t => ({
                    type: t.type,
                    affix1: t.affix1,
                    affix2: t.affix2,
                    price: t.price
                }))
            };

            configs[configName] = config;
            localStorage.setItem(this.getConfigsStorageKey(), JSON.stringify(configs));

            this.loadConfigsList();
            configNameInput.value = '';
            alert(`配置 "${configName}" 保存成功！`);
        } catch (e) {
            console.error('Error saving config:', e);
            alert('保存配置失败');
        }
    }

    loadConfig(configName) {
        if (!configName) return;

        try {
            const storedConfigs = localStorage.getItem(this.getConfigsStorageKey());
            if (!storedConfigs) return;

            const configs = JSON.parse(storedConfigs);
            const config = configs[configName];
            if (!config) return;

            if (config.equipmentLevel) {
                const el = document.getElementById('equipment-level-erosion-advanced');
                if (el) el.value = config.equipmentLevel;
            }
            if (config.equipmentPrice !== undefined) {
                const el = document.getElementById('equipment-price-advanced');
                if (el) el.value = config.equipmentPrice;
            }
            if (config.darkCorePrice !== undefined) {
                const el = document.getElementById('dark-core-price-advanced');
                if (el) el.value = config.darkCorePrice;
            }
            if (config.demonCorePrice !== undefined) {
                const el = document.getElementById('demon-core-price-advanced');
                if (el) el.value = config.demonCorePrice;
            }
            if (config.equipmentAffixCount !== undefined) {
                const el = document.getElementById('equipment-affix-count-advanced');
                if (el) el.value = config.equipmentAffixCount;
            }
            if (config.includeFee !== undefined) {
                const el = document.getElementById('include-fee');
                if (el) el.checked = config.includeFee;
            }
            if (config.mutationPrice !== undefined) {
                const el = document.getElementById('mutation-price');
                if (el) el.value = config.mutationPrice;
            }
            if (config.nonTargetPrice !== undefined) {
                const el = document.getElementById('non-target-price');
                if (el) el.value = config.nonTargetPrice;
            }

            this.targets = [];
            this.targetIdCounter = 0;
            const targetList = document.getElementById('target-list');
            if (targetList) {
                targetList.innerHTML = '';
            }

            if (config.targets && config.targets.length > 0) {
                config.targets.forEach(targetData => {
                    this.addTarget();
                    const lastTarget = this.targets[this.targets.length - 1];
                    if (lastTarget) {
                        lastTarget.type = targetData.type;
                        lastTarget.affix1 = targetData.affix1;
                        lastTarget.affix2 = targetData.affix2;
                        lastTarget.price = targetData.price;

                        const targetItem = document.getElementById(`target-${lastTarget.id}`);
                        if (targetItem) {
                            const typeSelect = targetItem.querySelector('.target-type');
                            const affix1Select = targetItem.querySelector('.affix1-select');
                            const affix2Select = targetItem.querySelector('.affix2-select');
                            const priceInput = targetItem.querySelector('.target-price');

                            if (typeSelect) typeSelect.value = targetData.type;
                            if (affix1Select) affix1Select.value = targetData.affix1;
                            if (affix2Select) {
                                if (targetData.type === 'double') {
                                    affix2Select.style.display = 'block';
                                    affix2Select.value = targetData.affix2;
                                } else {
                                    affix2Select.style.display = 'none';
                                }
                            }
                            if (priceInput) priceInput.value = targetData.price;
                        }
                    }
                });
            }

            this.saveToStorage();
        } catch (e) {
            console.error('Error loading config:', e);
            alert('加载配置失败');
        }
    }

    deleteConfig() {
        const configSelect = document.getElementById('load-config-select');
        const configName = configSelect?.value;
        
        if (!configName) {
            alert('请先选择要删除的配置');
            return;
        }

        if (!confirm(`确定要删除配置 "${configName}" 吗？`)) {
            return;
        }

        try {
            const storedConfigs = localStorage.getItem(this.getConfigsStorageKey());
            if (!storedConfigs) return;

            const configs = JSON.parse(storedConfigs);
            delete configs[configName];
            localStorage.setItem(this.getConfigsStorageKey(), JSON.stringify(configs));

            this.loadConfigsList();
            alert(`配置 "${configName}" 删除成功！`);
        } catch (e) {
            console.error('Error deleting config:', e);
            alert('删除配置失败');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.erosionCostCalculator = new ErosionCostCalculator();
    setTimeout(() => {
        if (window.erosionCostCalculator.currentMode === 'advanced') {
            window.erosionCostCalculator.switchMode('advanced');
        }
    }, 100);
});
