// 全局变量
let currentTab = 'crafting';

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    setupTabNavigation();
    setupFormValidation();
    setupAnimations();
    fixImagePaths();
    initializeDreamSystem();
    initializeSkillSystem();
    initializeSealSystem();
    initializeTowerSystem();
    initializeErosionSimulation();
    setupErosionEventListeners();
    setupCraftingEventListeners();
    
    // 初始化数据持久化系统
    setTimeout(async () => {
        try {
            await DataPersistence.loadAllData();
            setupAutoSave();
            console.log('数据持久化系统已初始化');
        } catch (error) {
            console.error('数据加载失败:', error);
            setupAutoSave(); // 即使加载失败也要启用自动保存
        }
    }, 1000);
}

// 技能系统数据和函数
const skillUpgradeData = {
    // 升级所需经验和灵感素
    requirements: {
        '1-2': { exp: 5, inspiration: 50 },
        '2-3': { exp: 10, inspiration: 100 },
        '3-4': { exp: 15, inspiration: 150 },
        '4-5': { exp: 20, inspiration: 200 }
    },
    // T级材料提供的经验值（需要根据实际游戏数据调整）
    materialExp: {
        't0': 10,  // T0材料每个提供10点经验
        't1': 5,   // T1材料每个提供5点经验
        't2': 2    // T2材料每个提供2点经验
    }
};

function initializeSkillSystem() {
    const currentLevelSelect = document.getElementById('current-level');
    const targetLevelSelect = document.getElementById('target-level');
    
    // 当前等级变化时更新目标等级选项
    currentLevelSelect.addEventListener('change', function() {
        const currentLevel = parseInt(this.value);
        targetLevelSelect.innerHTML = '';
        
        for (let i = currentLevel + 1; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i + '级';
            targetLevelSelect.appendChild(option);
        }
    });
    
    // 初始化目标等级选项
    currentLevelSelect.dispatchEvent(new Event('change'));
    
    // 添加数量输入框的滚轮事件
    ['t0-quantity', 't1-quantity', 't2-quantity'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('wheel', function(e) {
            e.preventDefault();
            const currentValue = parseInt(this.value) || 0;
            const delta = e.deltaY > 0 ? -1 : 1;
            const newValue = Math.max(0, currentValue + delta);
            this.value = newValue;
            
            // 触发计算更新
            calculateSkillUpgrade();
        });
    });
    
    // 添加输入变化事件监听
    ['current-level', 'target-level', 'inspiration-price', 't0-quantity', 't0-price', 't1-quantity', 't1-price', 't2-quantity', 't2-price'].forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener('change', calculateSkillUpgrade);
        element.addEventListener('input', calculateSkillUpgrade);
    });
}

function calculateSkillUpgrade() {
    const currentLevel = parseInt(document.getElementById('current-level').value);
    const targetLevel = parseInt(document.getElementById('target-level').value);
    const inspirationPrice = parseFloat(document.getElementById('inspiration-price').value) || 0;
    
    const t0Quantity = parseInt(document.getElementById('t0-quantity').value) || 0;
    const t0Price = parseFloat(document.getElementById('t0-price').value) || 0;
    const t1Quantity = parseInt(document.getElementById('t1-quantity').value) || 0;
    const t1Price = parseFloat(document.getElementById('t1-price').value) || 0;
    const t2Quantity = parseInt(document.getElementById('t2-quantity').value) || 0;
    const t2Price = parseFloat(document.getElementById('t2-price').value) || 0;
    
    if (!targetLevel || targetLevel <= currentLevel) {
        // 重置显示
        document.getElementById('total-exp-needed').textContent = '0';
        document.getElementById('current-exp-provided').textContent = '0';
        document.getElementById('inspiration-needed').textContent = '0';
        document.getElementById('total-cost').textContent = '0 初火源质';
        return;
    }
    
    // 计算所需总经验和灵感素
    let totalExpNeeded = 0;
    let totalInspirationNeeded = 0;
    
    for (let level = currentLevel; level < targetLevel; level++) {
        const key = `${level}-${level + 1}`;
        if (skillUpgradeData.requirements[key]) {
            totalExpNeeded += skillUpgradeData.requirements[key].exp;
            totalInspirationNeeded += skillUpgradeData.requirements[key].inspiration;
        }
    }
    
    // 计算当前材料提供的经验
    const currentExpProvided = 
        t0Quantity * skillUpgradeData.materialExp.t0 +
        t1Quantity * skillUpgradeData.materialExp.t1 +
        t2Quantity * skillUpgradeData.materialExp.t2;
    
    // 计算总成本
    const materialCost = t0Quantity * t0Price + t1Quantity * t1Price + t2Quantity * t2Price;
    const inspirationCost = totalInspirationNeeded * inspirationPrice;
    const totalCost = materialCost + inspirationCost;
    
    // 更新显示
    document.getElementById('total-exp-needed').textContent = totalExpNeeded;
    document.getElementById('current-exp-provided').textContent = currentExpProvided;
    document.getElementById('inspiration-needed').textContent = totalInspirationNeeded;
    document.getElementById('total-cost').textContent = totalCost.toFixed(2) + ' 初火源质';
    
    // 如果经验不足，显示警告颜色
    const expProvidedElement = document.getElementById('current-exp-provided');
    if (currentExpProvided < totalExpNeeded) {
        expProvidedElement.style.color = '#ff6b6b';
    } else {
        expProvidedElement.style.color = '#4a9eff';
    }
}

// 设置标签页导航
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 移除所有活动状态
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加活动状态
            this.classList.add('active');
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
                currentTab = tabId;
            }
            
            // 添加切换动画
            targetTab.style.opacity = '0';
            targetTab.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                targetTab.style.transition = 'all 0.5s ease';
                targetTab.style.opacity = '1';
                targetTab.style.transform = 'translateY(0)';
            }, 50);
        });
    });
}

// 设置表单验证
function setupFormValidation() {
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    numberInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = 0;
            }
            
            // 添加输入动画效果
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
        
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });
}

// 设置动画效果
function setupAnimations() {
    // 为模块卡片添加进入动画
    const moduleCards = document.querySelectorAll('.module-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    moduleCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// 打造系统计算函数
function calculateCraftingCost() {
    try {
        // 获取装备参数
        const weaponType = document.querySelector('input[name="weapon-type"]:checked').value;
        const equipmentLevel = document.querySelector('input[name="equipment-level"]:checked').value;
        
        // 获取词缀选择
        const affixes = {
            basic: parseInt(document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(2) select').value) || 0,
            basicT0: parseInt(document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(3) select').value) || 0,
            basicUpgrade: parseInt(document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(4) select').value) || 0,
            advanced: parseInt(document.querySelector('.affix-category:nth-child(2) .affix-row:nth-child(2) select').value) || 0,
            advancedT0: parseInt(document.querySelector('.affix-category:nth-child(2) .affix-row:nth-child(3) select').value) || 0,
            advancedUpgrade: parseInt(document.querySelector('.affix-category:nth-child(2) .affix-row:nth-child(4) select').value) || 0,
            perfect: parseInt(document.querySelector('.affix-category:nth-child(3) .affix-row:nth-child(2) select').value) || 0,
            perfectT0: parseInt(document.querySelector('.affix-category:nth-child(3) .affix-row:nth-child(3) select').value) || 0,
            perfectUpgrade: parseInt(document.querySelector('.affix-category:nth-child(3) .affix-row:nth-child(4) select').value) || 0
        };
        
        // 获取材料价格
        const materials = {
            lingsha: parseFloat(document.getElementById('lingsha-price').value) || 0,
            chuhuo: 1, // 初火源质恒定为1，不需要输入框
            zhengui: parseFloat(document.getElementById('zhengui-price').value) || 0,
            xishi: parseFloat(document.getElementById('xishi-price').value) || 0,
            zhizhen: parseFloat(document.getElementById('zhizhen-price').value) || 0,
            shensheng: parseFloat(document.getElementById('shensheng-price').value) || 0
        };
        
        // 打造数据配置
        const craftingData = {
            82: {
                single: {
                    basic: { materials: { lingsha: 5, zhengui: 1 }, successRate: 0.035 },
                    advanced: { materials: { lingsha: 15, xishi: 1 }, successRate: 0.035 }
                },
                double: {
                    basic: { materials: { lingsha: 10, zhengui: 2 }, successRate: 0.035 },
                    advanced: { materials: { lingsha: 30, xishi: 2 }, successRate: 0.035 }
                }
            },
            86: {
                single: {
                    basic: { materials: { chuhuo: 1, zhengui: 10 }, successRate: 0.0333 },
                    advanced: { materials: { chuhuo: 3, xishi: 10 }, successRate: 0.0333 }
                },
                double: {
                    basic: { materials: { chuhuo: 2, zhengui: 20 }, successRate: 0.0333 },
                    advanced: { materials: { chuhuo: 6, xishi: 20 }, successRate: 0.0333 }
                }
            },
            100: {
                single: {
                    basic: { materials: { chuhuo: 1, zhengui: 10 }, successRate: 0.01 },
                    advanced: { materials: { chuhuo: 3, xishi: 10 }, successRate: 0.01 },
                    perfect: { materials: { chuhuo: 30, zhizhen: 1 }, successRate: 0.05 },
                    basicUpgrade: { materials: { chuhuo: 30, zhengui: 300, shensheng: 1 }, successRate: 0.3 },
                    advancedUpgrade: { materials: { chuhuo: 90, xishi: 300, shensheng: 3 }, successRate: 0.3 },
                    perfectUpgrade: { materials: { chuhuo: 180, zhizhen: 6, shensheng: 6 }, successRate: 0.3 }
                },
                double: {
                    basic: { materials: { chuhuo: 2, zhengui: 20 }, successRate: 0.01 },
                    advanced: { materials: { chuhuo: 6, xishi: 20 }, successRate: 0.01 },
                    perfect: { materials: { chuhuo: 60, zhizhen: 2 }, successRate: 0.05 },
                    basicUpgrade: { materials: { chuhuo: 60, zhengui: 600, shensheng: 2 }, successRate: 0.3 },
                    advancedUpgrade: { materials: { chuhuo: 180, xishi: 600, shensheng: 6 }, successRate: 0.3 },
                    perfectUpgrade: { materials: { chuhuo: 360, zhizhen: 12, shensheng: 12 }, successRate: 0.3 }
                }
            }
        };
        
        let totalCost = 0;
        const levelData = craftingData[equipmentLevel][weaponType];
        
        // 计算各种词缀的成本
        const affixTypes = [
            { count: affixes.basic, type: 'basic' },
            { count: affixes.basicUpgrade, type: 'basicUpgrade' },
            { count: affixes.advanced, type: 'advanced' },
            { count: affixes.advancedUpgrade, type: 'advancedUpgrade' },
            { count: affixes.perfect, type: 'perfect' },
            { count: affixes.perfectUpgrade, type: 'perfectUpgrade' }
        ];
        
        // 计算组合T0词缀的成本
        // 基础T0 = 基础T0 + 基础升T0
        if (affixes.basicT0 > 0) {
            const basicConfig = levelData['basic'];
            const basicUpgradeConfig = levelData['basicUpgrade'];
            if (basicConfig && basicUpgradeConfig) {
                let combinedCost = 0;
                
                // 计算基础T0成本
                let basicCost = 0;
                Object.keys(basicConfig.materials).forEach(materialKey => {
                    const materialCount = basicConfig.materials[materialKey];
                    const materialPrice = materials[materialKey];
                    basicCost += materialCount * materialPrice;
                });
                const basicExpectedCost = basicCost / basicConfig.successRate;
                
                // 计算基础升T0成本
                let basicUpgradeCost = 0;
                Object.keys(basicUpgradeConfig.materials).forEach(materialKey => {
                    const materialCount = basicUpgradeConfig.materials[materialKey];
                    const materialPrice = materials[materialKey];
                    basicUpgradeCost += materialCount * materialPrice;
                });
                const basicUpgradeExpectedCost = basicUpgradeCost / basicUpgradeConfig.successRate;
                
                combinedCost = (basicExpectedCost + basicUpgradeExpectedCost) * affixes.basicT0;
                totalCost += combinedCost;
            }
        }
        
        // 进阶T0 = 进阶T0 + 进阶升T0
        if (affixes.advancedT0 > 0) {
            const advancedConfig = levelData['advanced'];
            const advancedUpgradeConfig = levelData['advancedUpgrade'];
            if (advancedConfig && advancedUpgradeConfig) {
                let combinedCost = 0;
                
                // 计算进阶T0成本
                let advancedCost = 0;
                Object.keys(advancedConfig.materials).forEach(materialKey => {
                    const materialCount = advancedConfig.materials[materialKey];
                    const materialPrice = materials[materialKey];
                    advancedCost += materialCount * materialPrice;
                });
                const advancedExpectedCost = advancedCost / advancedConfig.successRate;
                
                // 计算进阶升T0成本
                let advancedUpgradeCost = 0;
                Object.keys(advancedUpgradeConfig.materials).forEach(materialKey => {
                    const materialCount = advancedUpgradeConfig.materials[materialKey];
                    const materialPrice = materials[materialKey];
                    advancedUpgradeCost += materialCount * materialPrice;
                });
                const advancedUpgradeExpectedCost = advancedUpgradeCost / advancedUpgradeConfig.successRate;
                
                combinedCost = (advancedExpectedCost + advancedUpgradeExpectedCost) * affixes.advancedT0;
                totalCost += combinedCost;
            }
        }
        
        // 至臻T0 = 基础T0 + 至臻升T0
        if (affixes.perfectT0 > 0) {
            const basicConfig = levelData['basic'];
            const perfectUpgradeConfig = levelData['perfectUpgrade'];
            if (basicConfig && perfectUpgradeConfig) {
                let combinedCost = 0;
                
                // 计算基础T0成本
                let basicCost = 0;
                Object.keys(basicConfig.materials).forEach(materialKey => {
                    const materialCount = basicConfig.materials[materialKey];
                    const materialPrice = materials[materialKey];
                    basicCost += materialCount * materialPrice;
                });
                const basicExpectedCost = basicCost / basicConfig.successRate;
                
                // 计算至臻升T0成本
                let perfectUpgradeCost = 0;
                Object.keys(perfectUpgradeConfig.materials).forEach(materialKey => {
                    const materialCount = perfectUpgradeConfig.materials[materialKey];
                    const materialPrice = materials[materialKey];
                    perfectUpgradeCost += materialCount * materialPrice;
                });
                const perfectUpgradeExpectedCost = perfectUpgradeCost / perfectUpgradeConfig.successRate;
                
                combinedCost = (basicExpectedCost + perfectUpgradeExpectedCost) * affixes.perfectT0;
                totalCost += combinedCost;
            }
        }
        
        affixTypes.forEach(affix => {
            if (affix.count > 0 && levelData[affix.type]) {
                const config = levelData[affix.type];
                let singleCost = 0;
                
                // 计算单次打造材料成本
                Object.keys(config.materials).forEach(materialKey => {
                    const materialCount = config.materials[materialKey];
                    const materialPrice = materials[materialKey];
                    singleCost += materialCount * materialPrice;
                });
                
                // 根据成功率计算期望成本
                const expectedCost = singleCost / config.successRate;
                totalCost += expectedCost * affix.count;
            }
        });
        
        // 获取勾选状态
        const includeDreamCost = document.getElementById('include-dream-cost').checked;
        const includeSequenceCost = document.getElementById('include-sequence-cost').checked;
        
        // 计算额外成本
        let dreamCost = 0;
        let sequenceCost = 0;
        
        if (includeDreamCost) {
            dreamCost = getDreamCostForCrafting();
        }
        
        if (includeSequenceCost) {
            sequenceCost = getSequenceCostForCrafting();
        }
        
        const finalTotalCost = totalCost + dreamCost + sequenceCost;
        
        // 更新结果显示
        updateCraftingResults(finalTotalCost, totalCost, dreamCost, sequenceCost, includeDreamCost, includeSequenceCost);
        
        // 添加结果动画
        const totalResultElement = document.getElementById('crafting-total-result');
        totalResultElement.style.transform = 'scale(1.1)';
        totalResultElement.style.color = '#ff6b6b';
        setTimeout(() => {
            totalResultElement.style.transform = 'scale(1)';
        }, 300);
        
        // 显示成功提示
        showNotification('计算完成！', 'success');
        
        // 保存材料价格到本地存储
        saveMaterialPrices(materials);
        
    } catch (error) {
        console.error('计算错误:', error);
        showNotification('计算出错，请检查输入数据', 'error');
    }
}

// 获取解梦成本用于打造系统
function getDreamCostForCrafting() {
    try {
        const positionSelect = document.getElementById('dream-position');
        const typeSelect = document.getElementById('dream-type');
        const levelSelect = document.getElementById('dream-level');
        const affixSelect = document.getElementById('dream-affix');
        const weaponPriceInput = document.getElementById('dream-weapon-price');
        const accessoryPriceInput = document.getElementById('dream-accessory-price');
        
        // 检查是否有完整的解梦配置
        if (!positionSelect || !typeSelect || !levelSelect || !affixSelect || 
            !weaponPriceInput || !accessoryPriceInput) {
            return 0;
        }
        
        const selectedPosition = positionSelect.value;
        const selectedType = typeSelect.value;
        const selectedLevel = parseInt(levelSelect.value);
        const selectedAffixIndex = parseInt(affixSelect.value);
        const weaponPrice = parseFloat(weaponPriceInput.value) || 0;
        const accessoryPrice = parseFloat(accessoryPriceInput.value) || 0;
        
        // 验证输入完整性
        if (!selectedPosition || !selectedType || isNaN(selectedAffixIndex)) {
            return 0;
        }
        
        // 获取装备数据
        const positionData = dreamData[selectedPosition];
        if (!positionData) {
            return 0;
        }
        
        // 获取词缀数据
        let affixes = [];
        if (selectedPosition === 'weapon' && weaponAffixes[selectedType]) {
            affixes = weaponAffixes[selectedType];
        } else if (selectedPosition === 'accessory' && accessoryAffixes[selectedType]) {
            affixes = accessoryAffixes[selectedType];
        }
        
        if (!affixes[selectedAffixIndex]) {
            return 0;
        }
        
        const selectedAffix = affixes[selectedAffixIndex];
        const totalWeight = affixes.reduce((sum, affix) => sum + affix.weight, 0);
        
        // 确定材料价格和消耗数量
        const isAccessory = positionData.isAccessory;
        const materialPrice = isAccessory ? accessoryPrice : weaponPrice;
        
        if (materialPrice <= 0) {
            return 0;
        }
        
        // 根据等级确定消耗数量
        let materialCount;
        switch (selectedLevel) {
            case 82:
                materialCount = 1;
                break;
            case 86:
                materialCount = 2;
                break;
            case 100:
                materialCount = 3;
                break;
            default:
                materialCount = 1;
        }
        
        // 计算解梦成本
        const baseProbability = selectedAffix.weight / totalWeight;
        const probability = baseProbability * 3; // 每次解梦给出3个选项
        const totalCost = (materialPrice * materialCount) / probability;
        
        return totalCost;
    } catch (error) {
        console.error('获取解梦成本错误:', error);
        return 0;
    }
}

// 获取序列成本用于打造系统
function getSequenceCostForCrafting() {
    try {
        const weaponTypeSelect = document.querySelector('#tower #weapon-type');
        const weaponLevelSelect = document.querySelector('#tower #weapon-level');
        const weaponCategorySelect = document.querySelector('#tower #weapon-category');
        const researchTypeSelect = document.getElementById('research-type');
        const targetSequenceInput = document.getElementById('target-sequence');
        
        // 检查是否有完整的高塔配置
        if (!weaponTypeSelect || !weaponLevelSelect || !weaponCategorySelect || 
            !researchTypeSelect || !targetSequenceInput) {
            return 0;
        }
        
        const weaponType = weaponTypeSelect.value;
        const weaponLevel = weaponLevelSelect.value;
        const weaponCategory = weaponCategorySelect.value;
        const researchType = researchTypeSelect.value;
        const targetSequence = targetSequenceInput.value;
        
        // 验证输入完整性
        if (!weaponType || !weaponLevel || !weaponCategory || !researchType || !targetSequence) {
            return 0;
        }
        
        // 验证序列格式
        const expectedLength = researchType === '基础' ? 3 : 4;
        if (targetSequence.length !== expectedLength || !/^[1-7]+$/.test(targetSequence)) {
            return 0;
        }
        
        // 获取材料需求
        const requirements = towerSystemData.researchRequirements[weaponLevel]?.[weaponCategory]?.[researchType];
        if (!requirements) {
            return 0;
        }
        
        // 获取元件价格
        const componentPrices = getTowerComponentPrices();
        const componentType = towerSystemData.weaponToComponent[weaponType];
        
        // 计算单次研发成本
        let singleCost = requirements.fireSource;
        
        if (requirements.basicComponent > 0) {
            singleCost += requirements.basicComponent * (componentPrices.basic || 0);
        }
        
        if (requirements.expandComponent > 0) {
            const componentPrice = componentPrices[componentType] || 0;
            singleCost += requirements.expandComponent * componentPrice;
        }
        
        // 分析序列模式并获取概率
        const pattern = analyzeSequencePattern(targetSequence);
        if (!pattern) {
            return 0;
        }
        
        const probability = towerSystemData.sequenceProbabilities[researchType][pattern];
        if (probability === undefined) {
            return 0;
        }
        
        // 计算期望成本
        const expectedCost = singleCost / (probability / 100);
        
        return expectedCost;
    } catch (error) {
        console.error('获取序列成本错误:', error);
        return 0;
    }
}

// 更新打造系统结果显示
function updateCraftingResults(totalCost, baseCost, dreamCost, sequenceCost, showDream, showSequence) {
    // 更新总成本
    const totalResultElement = document.getElementById('crafting-total-result');
    totalResultElement.textContent = `${totalCost.toFixed(2)} 初火源质`;
    
    // 更新打造成本
    const baseCostElement = document.getElementById('crafting-base-cost');
    baseCostElement.textContent = `${baseCost.toFixed(2)} 初火源质`;
    
    // 更新解梦成本显示
    const dreamCostItem = document.getElementById('dream-cost-item');
    const dreamCostElement = document.getElementById('crafting-dream-cost');
    if (showDream && dreamCost > 0) {
        dreamCostElement.textContent = `${dreamCost.toFixed(2)} 初火源质`;
        dreamCostItem.style.display = 'flex';
    } else {
        dreamCostItem.style.display = 'none';
    }
    
    // 更新序列成本显示
    const sequenceCostItem = document.getElementById('sequence-cost-item');
    const sequenceCostElement = document.getElementById('crafting-sequence-cost');
    if (showSequence && sequenceCost > 0) {
        sequenceCostElement.textContent = `${sequenceCost.toFixed(2)} 初火源质`;
        sequenceCostItem.style.display = 'flex';
    } else {
        sequenceCostItem.style.display = 'none';
    }
}

// 设置打造系统事件监听器
function setupCraftingEventListeners() {
    // 为勾选框添加变化事件监听器
    const dreamCheckbox = document.getElementById('include-dream-cost');
    const sequenceCheckbox = document.getElementById('include-sequence-cost');
    
    if (dreamCheckbox) {
        dreamCheckbox.addEventListener('change', function() {
            // 当勾选状态改变时，如果有有效的打造配置，自动重新计算
            if (hasValidCraftingConfiguration()) {
                calculateCraftingCost();
            }
        });
    }
    
    if (sequenceCheckbox) {
        sequenceCheckbox.addEventListener('change', function() {
            // 当勾选状态改变时，如果有有效的打造配置，自动重新计算
            if (hasValidCraftingConfiguration()) {
                calculateCraftingCost();
            }
        });
    }
}

// 检查是否有有效的打造配置
function hasValidCraftingConfiguration() {
    try {
        const weaponType = document.querySelector('input[name="weapon-type"]:checked');
        const equipmentLevel = document.querySelector('input[name="equipment-level"]:checked');
        
        // 检查基本配置是否完整
        if (!weaponType || !equipmentLevel) {
            return false;
        }
        
        // 检查是否至少选择了一个词缀
        const affixSelects = document.querySelectorAll('.affix-category select');
        let hasAffix = false;
        
        affixSelects.forEach(select => {
            if (parseInt(select.value) > 0) {
                hasAffix = true;
            }
        });
        
        return hasAffix;
    } catch (error) {
        return false;
    }
}

// 保存材料价格
 function saveMaterialPrices(materials) {
     // 不保存初火源质价格，因为它是固定的
     const pricesForSave = {
         lingsha: materials.lingsha,
         zhengui: materials.zhengui,
         xishi: materials.xishi,
         zhizhen: materials.zhizhen,
         shensheng: materials.shensheng
     };
     localStorage.setItem('torchlight-material-prices', JSON.stringify(pricesForSave));
 }
 
 // 加载材料价格
 function loadMaterialPrices() {
     const saved = localStorage.getItem('torchlight-material-prices');
     if (saved) {
         const materials = JSON.parse(saved);
         document.getElementById('lingsha-price').value = materials.lingsha || '';
         document.getElementById('zhengui-price').value = materials.zhengui || '';
         document.getElementById('xishi-price').value = materials.xishi || '';
         document.getElementById('zhizhen-price').value = materials.zhizhen || '';
         document.getElementById('shensheng-price').value = materials.shensheng || '';
     }
 }

// 页面加载时恢复材料价格
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadMaterialPrices, 100);
});

// 修复图片路径
function fixImagePaths() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            if (!this.dataset.tried) {
                this.dataset.tried = true;
                const originalSrc = this.src;
                this.src = encodeURI(originalSrc);
            }
        });
    });
}

// 减伤计算函数
function calculateDamageReduction() {
    try {
        const drRows = document.querySelectorAll('.dr-row');
        let sourceReductions = []; // 存储每个序号来源的减伤值
        
        drRows.forEach((row, index) => {
            const method = row.querySelector('.dr-method').value;
            const layers = parseInt(row.querySelector('.dr-layers').value) || 0;
            const percent = parseFloat(row.querySelector('.dr-percent').value) || 0;
            
            if (layers > 0 && percent > 0) {
                let sourceReduction = 0;
                
                if (method === 'additive') {
                    // 加法减伤：层数 × 每层减伤
                    sourceReduction = layers * percent;
                } else if (method === 'multiply') {
                    // 乘法减伤：(1 - N₁%) × (1 - N₂%) × ... × (1 - Nₘ%)
                    // 每层减伤N在层数M下的计算公式为：1 - (1 - N%)^M
                    let multiplicativeResult = 1;
                    for (let i = 0; i < layers; i++) {
                        multiplicativeResult *= (1 - percent / 100);
                    }
                    sourceReduction = (1 - multiplicativeResult) * 100;
                }
                
                // 将该序号来源的减伤值添加到数组中
                if (sourceReduction > 0) {
                    sourceReductions.push(sourceReduction);
                }
            }
        });
        
        // 总减伤：所有序号来源的减伤相加
        const totalReduction = Math.min(sourceReductions.reduce((sum, reduction) => sum + reduction, 0), 100);
        
        // 显示结果
        const resultElement = document.getElementById('dr-result');
        resultElement.innerHTML = `总减伤：${totalReduction.toFixed(2)}%`;
        
        // 显示详细计算过程
        let detailText = '';
        sourceReductions.forEach((reduction, index) => {
            detailText += `序号${index + 1}：${reduction.toFixed(2)}% `;
        });
        if (detailText) {
            resultElement.innerHTML += ` <span class="dr-detail">(${detailText.trim()})</span>`;
        }
        
        // 添加结果动画
        resultElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            resultElement.style.transform = 'scale(1)';
        }, 300);
        
        showNotification('减伤计算完成！', 'success');
        
    } catch (error) {
        console.error('减伤计算错误:', error);
        showNotification('减伤计算出错，请检查输入数据', 'error');
    }
}

// 叠乘增伤计算函数
function calculateMultiplyDamage() {
    try {
        const singleIncrease = parseFloat(document.getElementById('single-damage-increase').value) || 0;
        const multiplyTimes = parseInt(document.getElementById('multiply-times').value) || 0;
        
        if (singleIncrease <= 0 || multiplyTimes <= 0) {
            showNotification('请输入有效的增伤数值和叠乘次数', 'warning');
            return;
        }
        
        // 叠乘增伤计算：(1 + 单次增伤%)^叠乘次数 - 1
        const totalIncrease = Math.pow(1 + singleIncrease / 100, multiplyTimes) - 1;
        const totalIncreasePercent = totalIncrease * 100;
        
        // 显示结果
        const resultElement = document.getElementById('multiply-result');
        resultElement.textContent = `总增伤：${totalIncreasePercent.toFixed(2)}%`;
        
        // 添加结果动画
        resultElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            resultElement.style.transform = 'scale(1)';
        }, 300);
        
        showNotification('增伤计算完成！', 'success');
        
    } catch (error) {
        console.error('增伤计算错误:', error);
        showNotification('增伤计算出错，请检查输入数据', 'error');
    }
}

// 伤害提升计算函数
function calculateDamageImprovement() {
    try {
        const damageBefore = parseFloat(document.getElementById('damage-before').value) || 0;
        const damageAfter = parseFloat(document.getElementById('damage-after').value) || 0;
        
        if (damageBefore <= 0 || damageAfter <= 0) {
            showNotification('请输入有效的伤害数值', 'warning');
            return;
        }
        
        if (damageAfter <= damageBefore) {
            showNotification('提升后伤害应大于提升前伤害', 'warning');
            return;
        }
        
        // 伤害提升百分比计算：(提升后 - 提升前) / 提升前 * 100%
        const improvement = ((damageAfter - damageBefore) / damageBefore) * 100;
        
        // 显示结果
        const resultElement = document.getElementById('improvement-result');
        resultElement.textContent = `伤害提升：${improvement.toFixed(2)}%`;
        
        // 添加结果动画
        resultElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            resultElement.style.transform = 'scale(1)';
        }, 300);
        
        showNotification('伤害提升计算完成！', 'success');
        
    } catch (error) {
        console.error('伤害提升计算错误:', error);
        showNotification('伤害提升计算出错，请检查输入数据', 'error');
    }
}

// 解梦系统数据
const dreamData = {
    accessory: {
        name: '饰品',
        isAccessory: true,
        types: [
            { value: 'ring', name: '戒指' },
            { value: 'necklace', name: '项链' },
            { value: 'belt', name: '腰带' }
        ]
    },
    weapon: {
        name: '武器',
        isAccessory: false,
        types: [
            // 单手武器
            { value: 'claw', name: '爪' },
            { value: 'dagger', name: '匕首' },
            { value: 'one_hand_sword', name: '单手剑' },
            { value: 'one_hand_hammer', name: '单手锤' },
            { value: 'one_hand_axe', name: '单手斧' },
            { value: 'staff', name: '法杖' },
            { value: 'spirit_staff', name: '灵杖' },
            { value: 'magic_wand', name: '魔杖' },
            { value: 'hand_staff', name: '手杖' },
            { value: 'pistol', name: '手枪' },
            // 双手武器
            { value: 'two_hand_sword', name: '双手剑' },
            { value: 'two_hand_hammer', name: '双手锤' },
            { value: 'two_hand_axe', name: '双手斧' },
            { value: 'tin_staff', name: '锡杖' },
            { value: 'war_staff', name: '武杖' },
            { value: 'bow', name: '弓' },
            { value: 'crossbow', name: '弩' },
            { value: 'rifle', name: '火枪' },
            { value: 'cannon', name: '火炮' }
        ]
    }
};

// 饰品词缀数据
const accessoryAffixes = {
    ring: [
        { name: '+(54–74) 最大生命', weight: 61 },
        { name: '+(87–117) 最大护盾', weight: 61 },
        { name: '+(5–10)% 火焰抗性', weight: 61 },
        { name: '+(5–10)% 冰冷抗性', weight: 61 },
        { name: '+(5–10)% 闪电抗性', weight: 61 },
        { name: '+(5–10)% 腐蚀抗性', weight: 61 },
        { name: '+(15–20) 力量', weight: 61 },
        { name: '+(15–20) 敏捷', weight: 61 },
        { name: '+(15–20) 智慧', weight: 61 },
        { name: '+(6–8)% 攻击和施法速度', weight: 61 },
        { name: '+(11–15)% 移动速度', weight: 13 },
        { name: '使用轰炸技能时， +(50–66)% 几率 +1 轰炸技能总波次', weight: 13 },
        { name: '+(15–20)% 战意效果', weight: 13 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '造成伤害时，触发 20 级盲目诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级胆怯诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级苦痛纠缠诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级冰寒之触诅咒，冷却时间为 0.2 秒', weight: 0 },
        { name: '附加 (18–20)% 物理伤害的火焰伤害', weight: 13 },
        { name: '附加 (18–20)% 物理伤害的冰冷伤害', weight: 13 },
        { name: '附加 (18–20)% 物理伤害的闪电伤害', weight: 13 },
        { name: '附加 (18–20)% 物理伤害的腐蚀伤害', weight: 13 }
    ],
    necklace: [
        { name: '+(54–74) 最大生命', weight: 46 },
        { name: '+(87–117) 最大护盾', weight: 46 },
        { name: '+(5–10)% 火焰抗性', weight: 46 },
        { name: '+(5–10)% 冰冷抗性', weight: 46 },
        { name: '+(5–10)% 闪电抗性', weight: 46 },
        { name: '+(5–10)% 腐蚀抗性', weight: 46 },
        { name: '+(3–4)% 元素抗性', weight: 46 },
        { name: '+(15–20) 力量', weight: 46 },
        { name: '+(15–20) 敏捷', weight: 46 },
        { name: '+(15–20) 智慧', weight: 46 },
        { name: '+(20–24)% 伤害 (20–24)% 召唤物伤害', weight: 46 },
        { name: '+(11–15)% 移动速度', weight: 15 },
        { name: '每拥有 1 层任意祝福， +(2–3)% 伤害', weight: 15 },
        { name: '每 27 点属性， +1% 伤害', weight: 15 },
        { name: '附加 10 异常基础伤害', weight: 15 },
        { name: '+(6–8)% 魔力封印补偿', weight: 15 },
        { name: '造成伤害时，触发 20 级易伤诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级炽热诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级蚀骨之寒诅咒，冷却时间为 0.2 秒', weight: 1 },
        { name: '造成伤害时，触发 20 级感电诅咒，冷却时间为 0.2 秒', weight: 1 },

    ],
    belt: [
        { name: '+(54–74) 最大生命', weight: 4 },
        { name: '+(40–60) 最大魔力', weight: 4 },
        { name: '+(87–117) 最大护盾', weight: 4 },
        { name: '+(5–10)% 火焰抗性', weight: 4 },
        { name: '+(5–10)% 冰冷抗性', weight: 4 },
        { name: '+(5–10)% 闪电抗性', weight: 4 },
        { name: '+(5–10)% 腐蚀抗性', weight: 4 },
        { name: '+(15–20) 力量', weight: 4 },
        { name: '+(15–20) 敏捷', weight: 4 },
        { name: '+(15–20) 智慧', weight: 4 },
        { name: '+(11–15)% 移动速度', weight: 1 },
        { name: '使用轰炸技能时， +(50–66)% 几率 +1 轰炸技能总波次', weight: 1 },
        { name: '+(8–10)% 冷却回复速度', weight: 1 },
        { name: '+(8–10)% 技能效果持续时间', weight: 1 },
        { name: '+(6–8)% 魔力封印补偿', weight: 1 },
        { name: '+(7–8)% 光环效果', weight: 1 }
    ]
};

// 武器词缀数据
const weaponAffixes = {
    // 单手武器词缀 (权重30/11/1)
    claw: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '+1 幻影数量', weight: 11 },
        { name: '额外 +(6–8)% 攻击伤害', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    dagger: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '+1 幻影数量', weight: 11 },
        { name: '额外 +(6–8)% 攻击伤害', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    pistol: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 远程伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    // 其他单手武器 (权重30/11/1)
    one_hand_sword: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '+(26–32)% 连续攻击几率', weight: 11 },
        { name: '连续攻击伤害递增 (10–16)%', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    one_hand_hammer: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '消耗破击蓄能时，该次技能额外 +(12–16)% 伤害', weight: 11 },
        { name: '造成伤害时，淘汰生命值低于 (5–7)% 的敌人', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    one_hand_axe: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 近战伤害', weight: 30 },
        { name: '+(6–8)% 攻击速度', weight: 30 },
        { name: '对创伤状态下的敌人，额外 +(6–8)% 伤害', weight: 11 },
        { name: '额外 +(6–9)% 斩击伤害', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 法术伤害', weight: 30 },
        { name: '+(6–8)% 施法速度', weight: 30 },
        { name: '+1 投射物数量', weight: 11 },
        { name: '+1 抛射投射物分裂数量', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    // 双手武器 (权重50/12/1 或 42/10/1)
    two_hand_sword: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 近战伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '+(30–32)% 连续攻击几率', weight: 10 },
        { name: '连续攻击伤害递增 (14–16)%', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    bow: [
        { name: '攻击附加 (10–13) - (14–19) 点物理伤害', weight: 50 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 50 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 50 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 50 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 50 },
        { name: '+(20–24)% 物理伤害', weight: 50 },
        { name: '+(20–24)% 元素伤害', weight: 50 },
        { name: '+(20–24)% 腐蚀伤害', weight: 50 },
        { name: '+(20–24)% 远程伤害', weight: 50 },
        { name: '+(6–8)% 攻击速度', weight: 50 },
        { name: '+1 投射物数量', weight: 12 },
        { name: '+1 直射投射物穿透次数', weight: 12 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 12 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 12 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 12 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 12 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 },
        { name: '攻击或法术击败敌人时（20-25）%几率爆炸，对半径5米内的敌人造成被击败的敌人最大生命（15-25）%的间接物理伤害', weight: 1 }
    ],
    spirit_staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 法术伤害', weight: 30 },
        { name: '+(6–8)% 施法速度', weight: 30 },
        { name: '+1 投射物数量', weight: 11 },
        { name: '+1 抛射投射物分裂数量', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    magic_wand: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 法术伤害', weight: 30 },
        { name: '+(6–8)% 施法速度', weight: 30 },
        { name: '+1 投射物数量', weight: 11 },
        { name: '+1 抛射投射物分裂数量', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    hand_staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 30 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 30 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 30 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 30 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 物理伤害', weight: 30 },
        { name: '+(20–24)% 元素伤害', weight: 30 },
        { name: '+(20–24)% 腐蚀伤害', weight: 30 },
        { name: '+(20–24)% 法术伤害', weight: 30 },
        { name: '+(6–8)% 施法速度', weight: 30 },
        { name: '+1 投射物数量', weight: 11 },
        { name: '+1 抛射投射物分裂数量', weight: 11 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 11 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 11 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 }
    ],
    two_hand_hammer: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 近战伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '消耗破击蓄能时，该次技能额外 +(12–16)% 伤害', weight: 10 },
        { name: '造成伤害时，淘汰生命值低于 (5–7)% 的敌人', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    two_hand_axe: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 近战伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '对创伤状态下的敌人，额外 +(6–8)% 伤害', weight: 10 },
        { name: '额外 +(6–9)% 斩击伤害', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    tin_staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 法术伤害', weight: 42 },
        { name: '+(6–8)% 施法速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    war_staff: [
        { name: '法术附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '法术附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '法术附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '法术附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '法术附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 法术伤害', weight: 42 },
        { name: '+(6–8)% 施法速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    crossbow: [
        { name: '攻击附加 (10–13) - (14–19) 点物理伤害', weight: 50 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 50 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 50 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 50 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 50 },
        { name: '+(20–24)% 物理伤害', weight: 50 },
        { name: '+(20–24)% 元素伤害', weight: 50 },
        { name: '+(20–24)% 腐蚀伤害', weight: 50 },
        { name: '+(20–24)% 远程伤害', weight: 50 },
        { name: '+(6–8)% 攻击速度', weight: 50 },
        { name: '+1 投射物数量', weight: 12 },
        { name: '+1 直射投射物穿透次数', weight: 12 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 12 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 12 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 12 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 12 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    rifle: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 远程伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ],
    cannon: [
        { name: '攻击附加 (10–15) - (14–19) 点物理伤害', weight: 42 },
        { name: '攻击附加 (9–14) - (15–20) 点火焰伤害', weight: 42 },
        { name: '攻击附加 (10–15) - (14–19) 点冰冷伤害', weight: 42 },
        { name: '攻击附加 (1–2) - (28–32) 点闪电伤害', weight: 42 },
        { name: '攻击附加 (11–16) - (13–18) 点腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 物理伤害', weight: 42 },
        { name: '+(20–24)% 元素伤害', weight: 42 },
        { name: '+(20–24)% 腐蚀伤害', weight: 42 },
        { name: '+(20–24)% 远程伤害', weight: 42 },
        { name: '+(6–8)% 攻击速度', weight: 42 },
        { name: '+1 投射物数量', weight: 10 },
        { name: '+1 抛射投射物分裂数量', weight: 10 },
        { name: '+(6–8)% 元素和腐蚀抗性穿透', weight: 10 },
        { name: '+(5–7)% 护甲减伤穿透', weight: 10 },
        { name: '+1 坚韧祝福层数上限', weight: 1 },
        { name: '+1 灵动祝福层数上限', weight: 1 },
        { name: '+1 聚能祝福层数上限', weight: 1 },
        { name: '+(24–32)% 该装备物理伤害', weight: 10 },
        { name: '该装备附加 (32–34) - (40–42) 点物理伤害', weight: 10 },
        { name: '暴击幸运 +(60–75) 暴击值', weight: 1 }
    ]
};

// 初始化解梦系统
function initializeDreamSystem() {
    const positionSelect = document.getElementById('dream-position');
    const typeSelect = document.getElementById('dream-type');
    const affixSelect = document.getElementById('dream-affix');
    
    // 部位选择变化事件
    positionSelect.addEventListener('change', function() {
        const selectedPosition = this.value;
        
        // 清空类型和词缀选择
        typeSelect.innerHTML = '<option value="">请选择装备类型</option>';
        affixSelect.innerHTML = '<option value="">请先选择装备类型</option>';
        
        if (selectedPosition && dreamData[selectedPosition]) {
            const positionData = dreamData[selectedPosition];
            typeSelect.disabled = false;
            
            // 填充类型选项
            positionData.types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.name;
                typeSelect.appendChild(option);
            });
        } else {
            typeSelect.disabled = true;
            affixSelect.disabled = true;
        }
    });
    
    // 类型选择变化事件
    typeSelect.addEventListener('change', function() {
        const selectedPosition = positionSelect.value;
        const selectedType = this.value;
        
        // 清空词缀选择
        affixSelect.innerHTML = '<option value="">请选择需求词缀</option>';
        
        if (selectedPosition && selectedType) {
            let affixes = [];
            
            if (selectedPosition === 'weapon' && weaponAffixes[selectedType]) {
                affixes = weaponAffixes[selectedType];
            } else if (selectedPosition === 'accessory' && accessoryAffixes[selectedType]) {
                affixes = accessoryAffixes[selectedType];
            }
            
            if (affixes.length > 0) {
                affixSelect.disabled = false;
                
                // 填充词缀选项
                affixes.forEach((affix, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${affix.name} (权重: ${affix.weight})`;
                    affixSelect.appendChild(option);
                });
            } else {
                affixSelect.disabled = true;
            }
        } else {
            affixSelect.disabled = true;
        }
    });
}

// 计算解梦成本
function calculateDreamCost() {
    const positionSelect = document.getElementById('dream-position');
    const typeSelect = document.getElementById('dream-type');
    const levelSelect = document.getElementById('dream-level');
    const affixSelect = document.getElementById('dream-affix');
    const weaponPriceInput = document.getElementById('dream-weapon-price');
    const accessoryPriceInput = document.getElementById('dream-accessory-price');
    const resultElement = document.getElementById('dream-result');
    
    const selectedPosition = positionSelect.value;
    const selectedType = typeSelect.value;
    const selectedLevel = parseInt(levelSelect.value);
    const selectedAffixIndex = parseInt(affixSelect.value);
    const weaponPrice = parseFloat(weaponPriceInput.value) || 0;
    const accessoryPrice = parseFloat(accessoryPriceInput.value) || 0;
    
    // 验证输入
    if (!selectedPosition || !selectedType || isNaN(selectedAffixIndex)) {
        resultElement.textContent = '请完整选择装备信息和需求词缀';
        return;
    }
    
    // 获取装备数据
    const positionData = dreamData[selectedPosition];
    if (!positionData) {
        resultElement.textContent = '装备数据错误';
        return;
    }
    
    // 获取词缀数据
    let affixes = [];
    if (selectedPosition === 'weapon' && weaponAffixes[selectedType]) {
        affixes = weaponAffixes[selectedType];
    } else if (selectedPosition === 'accessory' && accessoryAffixes[selectedType]) {
        affixes = accessoryAffixes[selectedType];
    }
    
    if (!affixes[selectedAffixIndex]) {
        resultElement.textContent = '词缀数据错误';
        return;
    }
    
    const selectedAffix = affixes[selectedAffixIndex];
    
    // 计算总权重
    const totalWeight = affixes.reduce((sum, affix) => sum + affix.weight, 0);
    
    // 确定材料价格和消耗数量
    const isAccessory = positionData.isAccessory;
    const materialPrice = isAccessory ? accessoryPrice : weaponPrice;
    const materialName = isAccessory ? '梦语-饰品' : '梦语-武器';
    
    if (materialPrice <= 0) {
        resultElement.textContent = `请输入有效的${materialName}价格`;
        return;
    }
    
    // 根据等级确定消耗数量
    let materialCount;
    switch (selectedLevel) {
        case 82:
            materialCount = 1;
            break;
        case 86:
            materialCount = 2;
            break;
        case 100:
            materialCount = 3;
            break;
        default:
            materialCount = 1;
    }
    
    // 计算解梦成本
    // 公式：（需要解梦的词缀权重/该装备所有解梦词缀权重总和）*（对应解梦材料价格*需要消耗的材料数量）
    // 注意：每次解梦会给出3个词缀选项，所以获得想要词缀的几率要乘以3
    const baseProbability = selectedAffix.weight / totalWeight;
    const probability = baseProbability * 3; // 每次解梦给出3个选项
    const totalCost = (materialPrice * materialCount) / probability;
    
    // 显示结果
    resultElement.innerHTML = `
        <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 0.5rem;">
            解梦成本：${totalCost.toFixed(2)} 初火源质
        </div>
        <div style="font-size: 0.9em; color: rgba(255,255,255,0.8); line-height: 1.4;">
            词缀权重：${selectedAffix.weight} / 总权重：${totalWeight}<br>
            出现概率：${(probability * 100).toFixed(2)}%<br>
            材料消耗：${materialName} × ${materialCount}<br>
            材料单价：${materialPrice} 初火源质
        </div>
    `;
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动移除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 获取通知图标
function getNotificationIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// 获取通知颜色
function getNotificationColor(type) {
    const colors = {
        'success': 'linear-gradient(135deg, #4CAF50, #45a049)',
        'error': 'linear-gradient(135deg, #f44336, #d32f2f)',
        'warning': 'linear-gradient(135deg, #ff9800, #f57c00)',
        'info': 'linear-gradient(135deg, #2196F3, #1976D2)'
    };
    return colors[type] || colors.info;
}

// 数据导出功能
function exportData() {
    const data = {
        timestamp: new Date().toISOString(),
        crafting: getCraftingData(),
        damage: getDamageData()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `torch_calculator_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('数据导出成功！', 'success');
}

// 获取打造系统数据
function getCraftingData() {
    return {
        weaponType: document.querySelector('input[name="weapon-type"]:checked')?.value,
        equipmentLevel: document.querySelector('input[name="equipment-level"]:checked')?.value,
        affixes: {
            basic: document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(2) select')?.value,
            basicT0: document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(3) select')?.value,
            // ... 其他词缀数据
        },
        materials: Array.from(document.querySelectorAll('.material-input')).map(input => input.value)
    };
}

// 获取伤害系统数据
function getDamageData() {
    return {
        damageReduction: Array.from(document.querySelectorAll('.dr-row')).map(row => ({
            source: `来源${row.querySelector('.dr-number')?.textContent}`,
            method: row.querySelector('.dr-method')?.value,
            layers: row.querySelector('.dr-layers')?.value,
            percent: row.querySelector('.dr-percent')?.value
        })),
        multiplyDamage: {
            singleIncrease: document.getElementById('single-damage-increase')?.value,
            multiplyTimes: document.getElementById('multiply-times')?.value
        },
        damageImprovement: {
            before: document.getElementById('damage-before')?.value,
            after: document.getElementById('damage-after')?.value
        }
    };
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter 执行当前标签页的计算
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (currentTab === 'crafting') {
            calculateCraftingCost();
        } else if (currentTab === 'damage') {
            // 根据焦点元素决定执行哪个计算
            const focusedElement = document.activeElement;
            const parentCard = focusedElement.closest('.module-card');
            
            if (parentCard) {
                const cardTitle = parentCard.querySelector('h3').textContent;
                if (cardTitle.includes('减伤')) {
                    calculateDamageReduction();
                } else if (cardTitle.includes('叠乘')) {
                    calculateMultiplyDamage();
                } else if (cardTitle.includes('提升')) {
                    calculateDamageImprovement();
                }
            }
        }
    }
    
    // Ctrl + S 导出数据
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        exportData();
    }
});

// 添加工具提示
function addTooltips() {
    const tooltips = {
        'weapon-type': '选择装备类型会影响基础成本计算',
        'equipment-level': '装备等级越高，基础成本越高',
        'affix-select': '词缀数量会影响材料消耗',
        'material-input': '输入当前市场价格以获得准确成本',
        'dr-method': '叠加：直接相加；叠乘：按比例计算',
        'dr-layers': '减伤效果的层数',
        'dr-percent': '每层减伤的百分比'
    };
    
    Object.keys(tooltips).forEach(className => {
        const elements = document.querySelectorAll(`.${className}`);
        elements.forEach(element => {
            element.title = tooltips[className];
        });
    });
}

// 初始化工具提示
addTooltips();

// 性能优化：防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 实时计算（可选功能）
const debouncedCalculate = debounce(() => {
    if (currentTab === 'crafting') {
        calculateCraftingCost();
    }
}, 1000);

// 为输入框添加实时计算（可选）
// document.querySelectorAll('input, select').forEach(element => {
//     element.addEventListener('input', debouncedCalculate);
// });

// 数量调整函数
function adjustQuantity(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(0, currentValue + delta);
    
    input.value = newValue;
    
    // 触发input事件以更新计算
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

// 封印系统数据和函数
const supportSkillsData = {
    // 固定魔力封印补偿的技能
    fixedSkills: {
        '贯注强化': { compensation: 0, multiplier: 100 },
        '精密 贯注强化': { compensation: -15, multiplier: 100 },
        '贯注增效': { compensation: -30, multiplier: 100 },
        '精密 贯注增效': { compensation: -18, multiplier: 100 },
        '激流': { compensation: -30, multiplier: 100 },
        '精密 激流': { compensation: -14.5, multiplier: 100 },
        '精密 超能共生': { compensation: -20, multiplier: 100 },
        '精密 魔灵之友': { compensation: -30, multiplier: 100 },
        '精密 封印转化': { compensation: -60, multiplier: 100 },
        '精密 无私': { compensation: -12, multiplier: 100 },
        '精密 自私': { compensation: -12, multiplier: 100 },
        '精密 多则能成': { compensation: 0, multiplier: 100 },
        '精密 律己': { compensation: -20.9, multiplier: 100 },
        '精密 全神贯注': { compensation: 0, multiplier: 100 },
        '精密 遇强则强': { compensation: -15, multiplier: 100 },
        '精密 人多势众': { compensation: -12, multiplier: 100 },
        '精密 保护力场': { compensation: -30, multiplier: 100 },
        '保护力场': { compensation: -30, multiplier: 100 },
        '魔灵之友': { compensation: -30, multiplier: 100 },
        // 新增技能类型
        '所有贯注华贵/崇高技能': { compensation: 0, multiplier: 110 },
        '其他魔力消耗倍率100%技能': { compensation: 0, multiplier: 100 },
        '其他魔力消耗倍率110%技能': { compensation: 0, multiplier: 110 },
        '其他魔力封印补偿为0%技能': { compensation: 0, multiplier: 100 }
    },
    // 等级相关的技能
    levelBasedSkills: {
        '节流': {
            multiplier: 100,
            levels: {
                1: 0.5, 2: 1, 3: 1.5, 4: 2, 5: 2.5, 6: 3, 7: 3.5, 8: 4, 9: 4.5, 10: 5,
                11: 5.5, 12: 6, 13: 6.5, 14: 7, 15: 7.5, 16: 8, 17: 8.5, 18: 9, 19: 9.5, 20: 10,
                21: 10.5, 22: 11, 23: 11.5, 24: 12, 25: 12.5, 26: 13, 27: 13.5, 28: 14, 29: 14.5, 30: 15,
                31: 15.5, 32: 16, 33: 16.5, 34: 17, 35: 17.5, 36: 18, 37: 18.5, 38: 19, 39: 19.5, 40: 20
            }
        },
        '精密 节流': {
            multiplier: 100,
            levels: {
                1: 15.5, 2: 16, 3: 16.5, 4: 17, 5: 17.5, 6: 18, 7: 18.5, 8: 19, 9: 19.5, 10: 20,
                11: 20.5, 12: 21, 13: 21.5, 14: 22, 15: 22.5, 16: 23, 17: 23.5, 18: 24, 19: 24.5, 20: 25,
                21: 25.5, 22: 26, 23: 26.5, 24: 27, 25: 27.5, 26: 28, 27: 28.5, 28: 29, 29: 29.5, 30: 30,
                31: 30.5, 32: 31, 33: 31.5, 34: 32, 35: 32.5, 36: 33, 37: 33.5, 38: 34, 39: 34.5, 40: 35
            }
        },
        '封印转化': {
            multiplier: 100,
            levels: {
                1: -70, 2: -69.75, 3: -69.5, 4: -69.25, 5: -69, 6: -68.75, 7: -68.5, 8: -68.25, 9: -68, 10: -67.75,
                11: -67.5, 12: -67.25, 13: -67, 14: -66.75, 15: -66.5, 16: -66.25, 17: -66, 18: -65.75, 19: -65.5, 20: -65.25,
                21: -65, 22: -64.25, 23: -63.5, 24: -62.75, 25: -62, 26: -61.25, 27: -60.5, 28: -59.75, 29: -59, 30: -58.25,
                31: -57.5, 32: -56.75, 33: -56, 34: -55.25, 35: -54.5, 36: -53.75, 37: -53, 38: -52.25, 39: -51.5, 40: -50.75
            }
        },
        '超能共生': {
            multiplier: 100,
            levels: {
                1: 48.2, 2: 48.4, 3: 48.6, 4: 48.8, 5: 49, 6: 49.2, 7: 49.4, 8: 49.6, 9: 49.8, 10: 50,
                11: 50.2, 12: 50.4, 13: 50.6, 14: 50.8, 15: 51, 16: 51.2, 17: 51.4, 18: 51.6, 19: 51.8, 20: 52,
                21: 52.2, 22: 52.4, 23: 52.6, 24: 52.8, 25: 53, 26: 53.2, 27: 53.4, 28: 53.6, 29: 53.8, 30: 54,
                31: 54.2, 32: 54.4, 33: 54.6, 34: 54.8, 35: 55, 36: 55.2, 37: 55.4, 38: 55.6, 39: 55.8, 40: 56
            }
        }
    }
};

// 初始化封印系统
function initializeSealSystem() {
    setupSealHaloTabs();
    setupSealTypeListeners();
    populateSupportSkillDropdowns();
    setupSealCalculationListeners();
}

// 设置光环标签页
function setupSealHaloTabs() {
    const tabs = document.querySelectorAll('.seal-halo-tab');
    const panels = document.querySelectorAll('.seal-halo-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const haloNumber = this.dataset.halo;
            
            // 移除所有活动状态
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // 添加当前活动状态
            this.classList.add('active');
            document.getElementById(`seal-halo-${haloNumber}`).classList.add('active');
        });
    });
}

// 设置封印类型监听器
function setupSealTypeListeners() {
    for (let i = 1; i <= 4; i++) {
        const sealTypeSelect = document.getElementById(`seal-type-${i}`);
        const conversionGroup = document.getElementById(`conversion-group-${i}`);
        
        if (sealTypeSelect && conversionGroup) {
            sealTypeSelect.addEventListener('change', function() {
                if (this.value === 'life') {
                    conversionGroup.style.display = 'block';
                } else {
                    conversionGroup.style.display = 'none';
                }
            });
        }
    }
}

// 填充辅助技能下拉框
function populateSupportSkillDropdowns() {
    const allSkills = [];
    
    // 添加固定技能（排除封印转化相关）
    Object.keys(supportSkillsData.fixedSkills).forEach(skill => {
        if (!skill.includes('封印转化')) {
            allSkills.push(skill);
        }
    });
    
    // 添加等级相关技能（排除封印转化相关）
    Object.keys(supportSkillsData.levelBasedSkills).forEach(skill => {
        if (!skill.includes('封印转化')) {
            allSkills.push(skill);
        }
    });
    
    // 填充所有辅助技能下拉框
    for (let halo = 1; halo <= 4; halo++) {
        for (let skill = 1; skill <= 4; skill++) {
            const select = document.getElementById(`support-skill-${halo}-${skill}`);
            if (select) {
                // 清空现有选项
                select.innerHTML = '<option value="">请选择技能</option>';
                allSkills.forEach(skillName => {
                    const option = document.createElement('option');
                    option.value = skillName;
                    option.textContent = skillName;
                    select.appendChild(option);
                });
            }
        }
    }
    
    // 填充封印转化技能下拉框
    for (let i = 1; i <= 4; i++) {
        const conversionSelect = document.getElementById(`conversion-skill-${i}`);
        if (conversionSelect) {
            // 清空现有选项
            conversionSelect.innerHTML = '<option value="">请选择技能</option>';
            const conversionSkills = ['封印转化', '精密 封印转化'];
            conversionSkills.forEach(skill => {
                const option = document.createElement('option');
                option.value = skill;
                option.textContent = skill;
                conversionSelect.appendChild(option);
            });
        }
    }
}

// 设置封印计算监听器
function setupSealCalculationListeners() {
    // 为计算按钮添加事件监听
    const calculateBtn = document.getElementById('calculate-seal-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateSealSystem);
    }
    
    // 为所有相关输入添加事件监听
    const inputs = [
        'equipment-seal-compensation', 'other-seal-compensation'
    ];
    
    // 为所有光环的输入字段添加监听器
    for (let i = 1; i <= 4; i++) {
        inputs.push(
            `base-seal-${i}`,
            `seal-type-${i}`,
            `pathfinder-slots-${i}`,
            `conversion-skill-${i}`,
            `conversion-level-${i}`,
            `support-skill-${i}-1`,
            `support-level-${i}-1`,
            `support-skill-${i}-2`,
            `support-level-${i}-2`,
            `support-skill-${i}-3`,
            `support-level-${i}-3`,
            `support-skill-${i}-4`,
            `support-level-${i}-4`
        );
    }
    
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', calculateSealSystem);
            element.addEventListener('input', calculateSealSystem);
        }
    });
}

// 计算单个光环封印
function calculateIndividualHaloSeal() {
    for (let i = 1; i <= 4; i++) {
        const baseSeal = parseFloat(document.getElementById(`base-seal-${i}`).value) || 0;
        const sealType = document.getElementById(`seal-type-${i}`).value;
        const pathfinderSlots = parseInt(document.getElementById(`pathfinder-slots-${i}`).value) || 0;
        
        if (baseSeal === 0) {
            document.getElementById(`halo-result-${i}`).textContent = '0%';
            continue;
        }
        
        // 获取全局封印补偿
        const equipmentCompensation = parseFloat(document.getElementById('equipment-seal-compensation').value) || 0;
        const otherCompensation = parseFloat(document.getElementById('other-seal-compensation').value) || 0;
        const totalCompensation = (equipmentCompensation + otherCompensation) / 100;
        
        // 计算辅助技能魔力封印补偿
        let supportSkillCompensation = 0;
        for (let j = 1; j <= 4; j++) {
            const skillName = document.getElementById(`support-skill-${i}-${j}`).value;
            const skillLevel = parseInt(document.getElementById(`support-level-${i}-${j}`).value) || 1;
            
            if (skillName) {
                const compensation = getSupportSkillCompensation(skillName, skillLevel);
                supportSkillCompensation += compensation / 100;
            }
        }
        
        // 计算封印转化补偿（仅生命封印）
        let conversionCompensation = 0;
        if (sealType === 'life') {
            const conversionSkill = document.getElementById(`conversion-skill-${i}`).value;
            const conversionLevel = parseInt(document.getElementById(`conversion-level-${i}`).value) || 1;
            
            if (conversionSkill) {
                conversionCompensation = getSupportSkillCompensation(conversionSkill, conversionLevel) / 100;
            }
        }
        
        // 计算独辟蹊径减少
        const pathfinderReduction = Math.pow(0.95, pathfinderSlots);
        
        // 计算最终封印量
        let finalSeal;
        if (sealType === 'life') {
            // 生命封印公式
            finalSeal = (baseSeal / (1 + totalCompensation + supportSkillCompensation) * pathfinderReduction) / (1 + conversionCompensation);
        } else {
            // 魔力封印公式
            finalSeal = (baseSeal / (1 + totalCompensation + supportSkillCompensation) * pathfinderReduction);
        }
        
        document.getElementById(`halo-result-${i}`).textContent = finalSeal.toFixed(2) + '%';
    }
}

// 获取辅助技能魔力封印补偿
function getSupportSkillCompensation(skillName, level) {
    if (supportSkillsData.fixedSkills[skillName]) {
        return supportSkillsData.fixedSkills[skillName].compensation;
    }
    
    if (supportSkillsData.levelBasedSkills[skillName]) {
        return supportSkillsData.levelBasedSkills[skillName].levels[level] || 0;
    }
    
    return 0;
}

// 计算封印系统总结果
function calculateSealSystem() {
    // 先计算各个光环的封印
    calculateIndividualHaloSeal();
    
    let totalManaSeal = 0;
    let totalLifeSeal = 0;
    
    // 汇总各光环结果
    for (let i = 1; i <= 4; i++) {
        const sealType = document.getElementById(`seal-type-${i}`).value;
        const resultText = document.getElementById(`halo-result-${i}`).textContent;
        const sealValue = parseFloat(resultText.replace('%', '')) || 0;
        
        if (sealType === 'mana') {
            totalManaSeal += sealValue;
        } else if (sealType === 'life') {
            totalLifeSeal += sealValue;
        }
    }
    
    // 更新总结果显示
    document.getElementById('total-mana-seal').textContent = totalManaSeal.toFixed(2) + '%';
    document.getElementById('total-life-seal').textContent = totalLifeSeal.toFixed(2) + '%';
    
    // 显示通知
    showNotification('封印计算完成！', 'success');
}



// 高塔系统数据和功能
const towerSystemData = {
    // 武器类型到元件类型的映射
    weaponToComponent: {
        '法杖': 'caster',
        '灵杖': 'caster',
        '魔杖': 'caster',
        '手杖': 'caster',
        '锡杖': 'caster',
        '武杖': 'caster',
        '剑': 'guard',
        '斧': 'guard',
        '锤': 'guard',
        '爪': 'guard',
        '匕首': 'guard',
        '手枪': 'sniper',
        '弓': 'sniper',
        '弩': 'sniper',
        '炮': 'sniper',
        '火枪': 'sniper',
        '盾': 'defense'
    },
    
    // 研发材料需求配置
    researchRequirements: {
        '86': {
            '单手': {
                '基础': { fireSource: 40, basicComponent: 4, expandComponent: 0 },
                '深度': { fireSource: 200, basicComponent: 0, expandComponent: 4 }
            },
            '双手': {
                '基础': { fireSource: 80, basicComponent: 8, expandComponent: 0 },
                '深度': { fireSource: 400, basicComponent: 0, expandComponent: 8 }
            }
        },
        '100': {
            '单手': {
                '基础': { fireSource: 100, basicComponent: 10, expandComponent: 0 },
                '深度': { fireSource: 500, basicComponent: 0, expandComponent: 10 }
            },
            '双手': {
                '基础': { fireSource: 200, basicComponent: 20, expandComponent: 0 },
                '深度': { fireSource: 1000, basicComponent: 0, expandComponent: 20 }
            }
        }
    },
    
    // 序列概率配置
    sequenceProbabilities: {
        '基础': {
            'no_repeat': 10.69,      // 没有重复数字
            'one_double': 6.22,      // 1个数字重复2次
            'one_triple': 2.33       // 1个数字重复3次
        },
        '深度': {
            'no_repeat': 5.19,       // 没有重复数字
            'one_double': 1.8,       // 1个数字重复2次
            'two_double': 6.0,       // 2个数字重复2次
            'one_triple': 2.0,       // 1个数字重复3次
            'one_quadruple': 0.50    // 1个数字重复4次
        }
    }
};

// 初始化高塔系统
function initializeTowerSystem() {
    setupTowerEventListeners();
    loadTowerComponentPrices();
    console.log('高塔系统初始化完成');
}

// 设置高塔系统事件监听器
function setupTowerEventListeners() {
    // 武器配置变化监听
    const weaponInputs = ['weapon-type', 'weapon-level', 'weapon-category'];
    weaponInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateTowerMaterialsDisplay);
        }
    });
    
    // 研发类型变化监听
    const researchTypeElement = document.getElementById('research-type');
    if (researchTypeElement) {
        researchTypeElement.addEventListener('change', function() {
            updateTowerMaterialsDisplay();
            updateSequenceInputValidation();
        });
    }
    
    // 序列输入验证
    const sequenceInput = document.getElementById('target-sequence');
    if (sequenceInput) {
        sequenceInput.addEventListener('input', validateSequenceInput);
    }
    
    // 元件价格保存
    const priceInputs = ['basic-component-price', 'caster-component-price', 'guard-component-price', 'sniper-component-price', 'defense-component-price'];
    priceInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveTowerComponentPrices);
        }
    });
    
    // 计算按钮
    const calculateBtn = document.getElementById('tower-calculate');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateTowerResearch);
    }
}

// 更新材料需求显示
function updateTowerMaterialsDisplay() {
    const weaponType = document.getElementById('weapon-type')?.value;
    const weaponLevel = document.getElementById('weapon-level')?.value;
    const weaponCategory = document.getElementById('weapon-category')?.value;
    const researchType = document.getElementById('research-type')?.value;
    const materialsDisplay = document.getElementById('materials-display');
    
    if (!weaponType || !weaponLevel || !weaponCategory || !researchType || !materialsDisplay) {
        return;
    }
    
    const requirements = towerSystemData.researchRequirements[weaponLevel]?.[weaponCategory]?.[researchType];
    if (!requirements) {
        materialsDisplay.innerHTML = `
            <div class="materials-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <span>无效的配置组合</span>
            </div>
        `;
        return;
    }
    
    const componentType = towerSystemData.weaponToComponent[weaponType];
    const materials = [];
    
    // 添加初火源质
    materials.push({
        name: '初火源质',
        amount: requirements.fireSource
    });
    
    // 添加基础元件
    if (requirements.basicComponent > 0) {
        materials.push({
            name: '基础元件',
            amount: requirements.basicComponent
        });
    }
    
    // 添加拓展元件
    if (requirements.expandComponent > 0) {
        const componentNames = {
            'caster': '拓展元件-术士',
            'guard': '拓展元件-近卫',
            'sniper': '拓展元件-狙击',
            'defense': '拓展元件-重装'
        };
        materials.push({
            name: componentNames[componentType],
            amount: requirements.expandComponent
        });
    }
    
    // 生成材料列表HTML
    const materialsHTML = materials.map(material => `
        <div class="material-item">
            <span class="material-name">${material.name}</span>
            <span class="material-amount">${material.amount}</span>
        </div>
    `).join('');
    
    materialsDisplay.innerHTML = `
        <div class="materials-list">
            ${materialsHTML}
        </div>
    `;
}

// 更新序列输入验证规则
function updateSequenceInputValidation() {
    const researchType = document.getElementById('research-type')?.value;
    const sequenceInput = document.getElementById('target-sequence');
    
    if (!sequenceInput) return;
    
    if (researchType === '基础') {
        sequenceInput.maxLength = 3;
        sequenceInput.placeholder = '请输入3位数字(1-7)';
    } else if (researchType === '深度') {
        sequenceInput.maxLength = 4;
        sequenceInput.placeholder = '请输入4位数字(1-7)';
    } else {
        sequenceInput.placeholder = '请先选择研发类型';
    }
    
    // 清空当前输入
    sequenceInput.value = '';
}

// 验证序列输入
function validateSequenceInput(event) {
    const input = event.target;
    const value = input.value;
    const researchType = document.getElementById('research-type')?.value;
    
    // 只允许输入1-7的数字
    const validValue = value.replace(/[^1-7]/g, '');
    
    // 限制长度
    let maxLength = 0;
    if (researchType === '基础') maxLength = 3;
    else if (researchType === '深度') maxLength = 4;
    
    if (maxLength > 0 && validValue.length > maxLength) {
        input.value = validValue.substring(0, maxLength);
    } else {
        input.value = validValue;
    }
}

// 分析序列模式
function analyzeSequencePattern(sequence) {
    const digits = sequence.split('').map(Number);
    const counts = {};
    
    // 统计每个数字出现的次数
    digits.forEach(digit => {
        counts[digit] = (counts[digit] || 0) + 1;
    });
    
    const countValues = Object.values(counts).sort((a, b) => b - a);
    
    if (sequence.length === 3) {
        // 基础研发模式分析
        if (countValues[0] === 1) {
            return 'no_repeat';  // 没有重复
        } else if (countValues[0] === 2) {
            return 'one_double'; // 1个数字重复2次
        } else if (countValues[0] === 3) {
            return 'one_triple'; // 1个数字重复3次
        }
    } else if (sequence.length === 4) {
        // 深度研发模式分析
        if (countValues[0] === 1) {
            return 'no_repeat';  // 没有重复
        } else if (countValues[0] === 2 && countValues[1] === 2) {
            return 'two_double'; // 2个数字重复2次
        } else if (countValues[0] === 2 && countValues[1] === 1) {
            return 'one_double'; // 1个数字重复2次
        } else if (countValues[0] === 3) {
            return 'one_triple'; // 1个数字重复3次
        } else if (countValues[0] === 4) {
            return 'one_quadruple'; // 1个数字重复4次
        }
    }
    
    return null;
}

// 计算研发数据
function calculateTowerResearch() {
    const weaponType = document.getElementById('weapon-type')?.value;
    const weaponLevel = document.getElementById('weapon-level')?.value;
    const weaponCategory = document.getElementById('weapon-category')?.value;
    const researchType = document.getElementById('research-type')?.value;
    const targetSequence = document.getElementById('target-sequence')?.value;
    
    // 验证输入
    if (!weaponType || !weaponLevel || !weaponCategory || !researchType || !targetSequence) {
        showNotification('请填写完整的配置信息', 'warning');
        return;
    }
    
    // 验证序列格式
    const expectedLength = researchType === '基础' ? 3 : 4;
    if (targetSequence.length !== expectedLength) {
        showNotification(`${researchType}研发需要${expectedLength}位数字`, 'error');
        return;
    }
    
    if (!/^[1-7]+$/.test(targetSequence)) {
        showNotification('序列只能包含1-7的数字', 'error');
        return;
    }
    
    // 获取材料需求
    const requirements = towerSystemData.researchRequirements[weaponLevel]?.[weaponCategory]?.[researchType];
    if (!requirements) {
        showNotification('无效的配置组合', 'error');
        return;
    }
    
    // 获取元件价格
    const componentPrices = getTowerComponentPrices();
    const componentType = towerSystemData.weaponToComponent[weaponType];
    
    // 计算单次研发成本
    let singleCost = requirements.fireSource;
    
    if (requirements.basicComponent > 0) {
        singleCost += requirements.basicComponent * (componentPrices.basic || 0);
    }
    
    if (requirements.expandComponent > 0) {
        const componentPrice = componentPrices[componentType] || 0;
        singleCost += requirements.expandComponent * componentPrice;
    }
    
    // 分析序列模式并获取概率
    const pattern = analyzeSequencePattern(targetSequence);
    if (!pattern) {
        showNotification('无法分析序列模式', 'error');
        return;
    }
    
    const probability = towerSystemData.sequenceProbabilities[researchType][pattern];
    if (probability === undefined) {
        showNotification('无法获取序列概率', 'error');
        return;
    }
    
    // 计算期望成本
    const expectedCost = singleCost / (probability / 100);
    
    // 更新显示
    updateTowerResults(probability, expectedCost, singleCost);
    
    showNotification('计算完成！', 'success');
}

// 更新计算结果显示
function updateTowerResults(probability, expectedCost, singleCost) {
    const probabilityElement = document.getElementById('success-probability');
    const expectedCostElement = document.getElementById('expected-cost');
    const singleCostElement = document.getElementById('single-cost');
    
    if (probabilityElement) {
        probabilityElement.textContent = `${probability.toFixed(2)}%`;
    }
    
    if (expectedCostElement) {
        expectedCostElement.textContent = `${expectedCost.toFixed(1)} 初火源质`;
    }
    
    if (singleCostElement) {
        singleCostElement.textContent = `${singleCost.toFixed(1)} 初火源质`;
    }
}

// 保存元件价格到本地存储
function saveTowerComponentPrices() {
    const prices = {
        basic: parseFloat(document.getElementById('basic-component-price')?.value) || 0,
        caster: parseFloat(document.getElementById('caster-component-price')?.value) || 0,
        guard: parseFloat(document.getElementById('guard-component-price')?.value) || 0,
        sniper: parseFloat(document.getElementById('sniper-component-price')?.value) || 0,
        defense: parseFloat(document.getElementById('defense-component-price')?.value) || 0
    };
    
    localStorage.setItem('towerComponentPrices', JSON.stringify(prices));
}

// 从本地存储加载元件价格
function loadTowerComponentPrices() {
    try {
        const saved = localStorage.getItem('towerComponentPrices');
        if (saved) {
            const prices = JSON.parse(saved);
            
            if (prices.basic) document.getElementById('basic-component-price').value = prices.basic;
            if (prices.caster) document.getElementById('caster-component-price').value = prices.caster;
            if (prices.guard) document.getElementById('guard-component-price').value = prices.guard;
            if (prices.sniper) document.getElementById('sniper-component-price').value = prices.sniper;
            if (prices.defense) document.getElementById('defense-component-price').value = prices.defense;
        }
    } catch (error) {
        console.warn('加载元件价格失败:', error);
    }
}

// 获取当前元件价格
function getTowerComponentPrices() {
    return {
        basic: parseFloat(document.getElementById('basic-component-price')?.value) || 0,
        caster: parseFloat(document.getElementById('caster-component-price')?.value) || 0,
        guard: parseFloat(document.getElementById('guard-component-price')?.value) || 0,
        sniper: parseFloat(document.getElementById('sniper-component-price')?.value) || 0,
        defense: parseFloat(document.getElementById('defense-component-price')?.value) || 0
    };
}

// 统一数据持久化系统 - 使用服务器API替代localStorage
const DataPersistence = {
    // 缓存数据
    cachedData: {},
    
    // API调用方法
    async saveToServer(data) {
        try {
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!result.success) {
                console.error('保存数据失败:', result.error);
            }
            return result.success;
        } catch (error) {
            console.error('保存数据时发生错误:', error);
            return false;
        }
    },
    
    async loadFromServer() {
        try {
            const response = await fetch('/api/load-data');
            const result = await response.json();
            if (result.success) {
                this.cachedData = result.data || {};
                return this.cachedData;
            } else {
                console.error('加载数据失败:', result.error);
                return {};
            }
        } catch (error) {
            console.error('加载数据时发生错误:', error);
            return {};
        }
    },
    
    // 保存所有系统数据
    async saveAllData() {
        const allData = {
            crafting: this.getCraftingData(),
            damage: this.getDamageData(),
            dream: this.getDreamData(),
            skill: this.getSkillData(),
            seal: this.getSealData(),
            tower: this.getTowerData()
        };
        
        // 尝试保存到服务器，失败则使用localStorage
        try {
            return await this.saveToServer(allData);
        } catch (error) {
            console.log('服务器保存失败，使用本地存储:', error);
            // 回退到localStorage
            localStorage.setItem('torchlight-all-data', JSON.stringify(allData));
            return true;
        }
    },

    // 加载所有系统数据
    async loadAllData() {
        try {
            const data = await this.loadFromServer();
            if (data && typeof data === 'object') {
                if (data.crafting) this.setCraftingData(data.crafting);
                if (data.damage) this.setDamageData(data.damage);
                if (data.dream) this.setDreamData(data.dream);
                if (data.skill) this.setSkillData(data.skill);
                if (data.seal) this.setSealData(data.seal);
                if (data.tower) this.setTowerData(data.tower);
                return;
            }
        } catch (error) {
            console.log('服务器加载失败，使用本地存储:', error);
        }
        
        // 回退到localStorage
        const saved = localStorage.getItem('torchlight-all-data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.crafting) this.setCraftingData(data.crafting);
                if (data.damage) this.setDamageData(data.damage);
                if (data.dream) this.setDreamData(data.dream);
                if (data.skill) this.setSkillData(data.skill);
                if (data.seal) this.setSealData(data.seal);
                if (data.tower) this.setTowerData(data.tower);
            } catch (parseError) {
                console.error('解析本地数据失败:', parseError);
            }
        }
    },

    // 打造系统数据获取
    getCraftingData() {
        return {
            // 装备参数
            weaponType: document.querySelector('input[name="weapon-type"]:checked')?.value || '',
            equipmentLevel: document.querySelector('input[name="equipment-level"]:checked')?.value || '',
            
            // 词缀选择 - 使用更精确的选择器
            affixes: {
                // 基础词缀
                basic: document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(1) select')?.value || '0',
                basicT0: document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(2) select')?.value || '0',
                basicUpgrade: document.querySelector('.affix-category:nth-child(1) .affix-row:nth-child(3) select')?.value || '0',
                // 进阶词缀
                advanced: document.querySelector('.affix-category:nth-child(2) .affix-row:nth-child(1) select')?.value || '0',
                advancedT0: document.querySelector('.affix-category:nth-child(2) .affix-row:nth-child(2) select')?.value || '0',
                advancedUpgrade: document.querySelector('.affix-category:nth-child(2) .affix-row:nth-child(3) select')?.value || '0',
                // 至臻词缀
                perfect: document.querySelector('.affix-category:nth-child(3) .affix-row:nth-child(1) select')?.value || '0',
                perfectT0: document.querySelector('.affix-category:nth-child(3) .affix-row:nth-child(2) select')?.value || '0',
                perfectUpgrade: document.querySelector('.affix-category:nth-child(3) .affix-row:nth-child(3) select')?.value || '0'
            },
            
            // 材料价格
            materials: {
                lingsha: document.getElementById('lingsha-price')?.value || '',
                zhengui: document.getElementById('zhengui-price')?.value || '',
                xishi: document.getElementById('xishi-price')?.value || '',
                zhizhen: document.getElementById('zhizhen-price')?.value || '',
                shensheng: document.getElementById('shensheng-price')?.value || ''
            },
            
            // 解梦和序列成本选项
            includeDreamCost: document.getElementById('include-dream-cost')?.checked || false,
            includeSequenceCost: document.getElementById('include-sequence-cost')?.checked || false
        };
    },

    // 打造系统数据设置
    setCraftingData(data) {
        if (!data) return;
        
        // 恢复装备参数
        if (data.weaponType) {
            const weaponRadio = document.querySelector(`input[name="weapon-type"][value="${data.weaponType}"]`);
            if (weaponRadio) weaponRadio.checked = true;
        }
        
        if (data.equipmentLevel) {
            const equipmentRadio = document.querySelector(`input[name="equipment-level"][value="${data.equipmentLevel}"]`);
            if (equipmentRadio) equipmentRadio.checked = true;
        }
        
        // 恢复词缀选择
        if (data.affixes) {
            const affixSelectors = [
                { key: 'basic', selector: '.affix-category:nth-child(1) .affix-row:nth-child(1) select' },
                { key: 'basicT0', selector: '.affix-category:nth-child(1) .affix-row:nth-child(2) select' },
                { key: 'basicUpgrade', selector: '.affix-category:nth-child(1) .affix-row:nth-child(3) select' },
                { key: 'advanced', selector: '.affix-category:nth-child(2) .affix-row:nth-child(1) select' },
                { key: 'advancedT0', selector: '.affix-category:nth-child(2) .affix-row:nth-child(2) select' },
                { key: 'advancedUpgrade', selector: '.affix-category:nth-child(2) .affix-row:nth-child(3) select' },
                { key: 'perfect', selector: '.affix-category:nth-child(3) .affix-row:nth-child(1) select' },
                { key: 'perfectT0', selector: '.affix-category:nth-child(3) .affix-row:nth-child(2) select' },
                { key: 'perfectUpgrade', selector: '.affix-category:nth-child(3) .affix-row:nth-child(3) select' }
            ];
            
            affixSelectors.forEach(({ key, selector }) => {
                if (data.affixes[key]) {
                    const element = document.querySelector(selector);
                    if (element) element.value = data.affixes[key];
                }
            });
        }
        
        // 恢复材料价格
        if (data.materials) {
            const priceFields = ['lingsha', 'zhengui', 'xishi', 'zhizhen', 'shensheng'];
            priceFields.forEach(field => {
                if (data.materials[field]) {
                    const element = document.getElementById(`${field}-price`);
                    if (element) element.value = data.materials[field];
                }
            });
        }
        
        // 恢复解梦和序列成本勾选状态
        if (data.includeDreamCost !== undefined) {
            const dreamCheckbox = document.getElementById('include-dream-cost');
            if (dreamCheckbox) dreamCheckbox.checked = data.includeDreamCost;
        }
        
        if (data.includeSequenceCost !== undefined) {
            const sequenceCheckbox = document.getElementById('include-sequence-cost');
            if (sequenceCheckbox) sequenceCheckbox.checked = data.includeSequenceCost;
        }
    },

    // 伤害系统数据获取
    getDamageData() {
        const data = {
            // 减伤计算数据
            drRows: [],
            // 倍率伤害数据
            baseDamage: document.getElementById('base-damage')?.value || '',
            damageMultiplier: document.getElementById('damage-multiplier')?.value || '',
            // 伤害提升数据
            currentDamage: document.getElementById('current-damage')?.value || '',
            targetDamage: document.getElementById('target-damage')?.value || '',
            // 武器伤害计算数据
            weaponBaseDamage: document.getElementById('weapon-base-damage')?.value || '',
            physicalBonus: document.getElementById('physical-bonus')?.value || '',
            elementalBonus: document.getElementById('elemental-bonus')?.value || '',
            critChance: document.getElementById('crit-chance')?.value || '',
            critMultiplier: document.getElementById('crit-multiplier')?.value || '',
            attackSpeed: document.getElementById('attack-speed')?.value || '',
            // 麻痹计算数据
            paralysisLayers: document.getElementById('paralysis-layers')?.value || '',
            paralysisEffect: document.getElementById('paralysis-effect')?.value || '',
            conductive: document.getElementById('conductive')?.checked || false
        };
        
        // 获取减伤行数据
        const drRows = document.querySelectorAll('.dr-row');
        drRows.forEach((row, index) => {
            const typeSelect = row.querySelector('.dr-type');
            const valueInput = row.querySelector('.dr-value');
            if (typeSelect && valueInput) {
                data.drRows.push({
                    type: typeSelect.value,
                    value: valueInput.value
                });
            }
        });
        
        return data;
    },

    // 伤害系统数据设置
    setDamageData(data) {
        if (!data) return;
        
        // 恢复倍率伤害数据
        if (data.baseDamage) {
            const baseDamageEl = document.getElementById('base-damage');
            if (baseDamageEl) baseDamageEl.value = data.baseDamage;
        }
        if (data.damageMultiplier) {
            const damageMultiplierEl = document.getElementById('damage-multiplier');
            if (damageMultiplierEl) damageMultiplierEl.value = data.damageMultiplier;
        }
        
        // 恢复伤害提升数据
        if (data.currentDamage) {
            const currentDamageEl = document.getElementById('current-damage');
            if (currentDamageEl) currentDamageEl.value = data.currentDamage;
        }
        if (data.targetDamage) {
            const targetDamageEl = document.getElementById('target-damage');
            if (targetDamageEl) targetDamageEl.value = data.targetDamage;
        }
        
        // 恢复武器伤害计算数据
        if (data.weaponBaseDamage) {
            const weaponBaseDamageEl = document.getElementById('weapon-base-damage');
            if (weaponBaseDamageEl) weaponBaseDamageEl.value = data.weaponBaseDamage;
        }
        if (data.physicalBonus) {
            const physicalBonusEl = document.getElementById('physical-bonus');
            if (physicalBonusEl) physicalBonusEl.value = data.physicalBonus;
        }
        if (data.elementalBonus) {
            const elementalBonusEl = document.getElementById('elemental-bonus');
            if (elementalBonusEl) elementalBonusEl.value = data.elementalBonus;
        }
        if (data.critChance) {
            const critChanceEl = document.getElementById('crit-chance');
            if (critChanceEl) critChanceEl.value = data.critChance;
        }
        if (data.critMultiplier) {
            const critMultiplierEl = document.getElementById('crit-multiplier');
            if (critMultiplierEl) critMultiplierEl.value = data.critMultiplier;
        }
        if (data.attackSpeed) {
            const attackSpeedEl = document.getElementById('attack-speed');
            if (attackSpeedEl) attackSpeedEl.value = data.attackSpeed;
        }
        
        // 恢复麻痹计算数据
        if (data.paralysisLayers) {
            const paralysisLayersEl = document.getElementById('paralysis-layers');
            if (paralysisLayersEl) paralysisLayersEl.value = data.paralysisLayers;
        }
        if (data.paralysisEffect) {
            const paralysisEffectEl = document.getElementById('paralysis-effect');
            if (paralysisEffectEl) paralysisEffectEl.value = data.paralysisEffect;
        }
        if (data.conductive !== undefined) {
            const conductiveEl = document.getElementById('conductive');
            if (conductiveEl) conductiveEl.checked = data.conductive;
        }
        
        // 恢复减伤行数据
        if (data.drRows && data.drRows.length > 0) {
            const drRows = document.querySelectorAll('.dr-row');
            data.drRows.forEach((rowData, index) => {
                if (drRows[index]) {
                    const typeSelect = drRows[index].querySelector('.dr-type');
                    const valueInput = drRows[index].querySelector('.dr-value');
                    if (typeSelect && rowData.type) typeSelect.value = rowData.type;
                    if (valueInput && rowData.value) valueInput.value = rowData.value;
                }
            });
        }
    },

    // 解梦系统数据获取
    getDreamData() {
        return {
            // 武器部位和类型
            position: document.getElementById('dream-position')?.value || '',
            type: document.getElementById('dream-type')?.value || '',
            // 装备等级
            level: document.getElementById('dream-level')?.value || '',
            // 词缀选择
            affix: document.getElementById('dream-affix')?.value || '',
            // 材料价格
            weaponPrice: document.getElementById('dream-weapon-price')?.value || '',
            accessoryPrice: document.getElementById('dream-accessory-price')?.value || ''
        };
    },

    // 解梦系统数据设置
    setDreamData(data) {
        if (!data) return;
        
        // 恢复武器部位
        if (data.position) {
            const positionEl = document.getElementById('dream-position');
            if (positionEl) {
                positionEl.value = data.position;
                // 触发change事件以更新类型选项
                positionEl.dispatchEvent(new Event('change'));
            }
        }
        
        // 延迟恢复类型和词缀，确保选项已更新
        setTimeout(() => {
            // 恢复装备类型
            if (data.type) {
                const typeEl = document.getElementById('dream-type');
                if (typeEl) {
                    typeEl.value = data.type;
                    // 触发change事件以更新词缀选项
                    typeEl.dispatchEvent(new Event('change'));
                }
            }
            
            // 再次延迟恢复词缀选择
            setTimeout(() => {
                if (data.affix) {
                    const affixEl = document.getElementById('dream-affix');
                    if (affixEl) affixEl.value = data.affix;
                }
            }, 100);
        }, 100);
        
        // 恢复装备等级
        if (data.level) {
            const levelEl = document.getElementById('dream-level');
            if (levelEl) levelEl.value = data.level;
        }
        
        // 恢复材料价格
        if (data.weaponPrice) {
            const weaponPriceEl = document.getElementById('dream-weapon-price');
            if (weaponPriceEl) weaponPriceEl.value = data.weaponPrice;
        }
        if (data.accessoryPrice) {
            const accessoryPriceEl = document.getElementById('dream-accessory-price');
            if (accessoryPriceEl) accessoryPriceEl.value = data.accessoryPrice;
        }
    },

    // 技能系统数据获取
    getSkillData() {
        return {
            currentLevel: document.getElementById('current-level')?.value || '',
            targetLevel: document.getElementById('target-level')?.value || '',
            inspirationPrice: document.getElementById('inspiration-price')?.value || '',
            t0Quantity: document.getElementById('t0-quantity')?.value || '',
            t0Price: document.getElementById('t0-price')?.value || '',
            t1Quantity: document.getElementById('t1-quantity')?.value || '',
            t1Price: document.getElementById('t1-price')?.value || '',
            t2Quantity: document.getElementById('t2-quantity')?.value || '',
            t2Price: document.getElementById('t2-price')?.value || ''
        };
    },

    // 技能系统数据设置
    setSkillData(data) {
        if (!data) return;
        
        const fields = [
            'current-level', 'target-level', 'inspiration-price',
            't0-quantity', 't0-price', 't1-quantity', 't1-price', 't2-quantity', 't2-price'
        ];
        
        const dataKeys = [
            'currentLevel', 'targetLevel', 'inspirationPrice',
            't0Quantity', 't0Price', 't1Quantity', 't1Price', 't2Quantity', 't2Price'
        ];
        
        fields.forEach((fieldId, index) => {
            const dataKey = dataKeys[index];
            if (data[dataKey]) {
                const element = document.getElementById(fieldId);
                if (element) element.value = data[dataKey];
            }
        });
    },

    // 封印系统数据获取
    getSealData() {
        const data = {
            equipmentSealCompensation: document.getElementById('equipment-seal-compensation')?.value || '',
            otherSealCompensation: document.getElementById('other-seal-compensation')?.value || '',
            haloData: []
        };
        
        // 获取4个光环的数据
        for (let i = 1; i <= 4; i++) {
            const haloData = {
                baseSeal: document.getElementById(`base-seal-${i}`)?.value || '0',
                sealType: document.getElementById(`seal-type-${i}`)?.value || '',
                pathfinderSlots: document.getElementById(`pathfinder-slots-${i}`)?.value || '',
                conversionSkill: document.getElementById(`conversion-skill-${i}`)?.value || '',
                conversionLevel: document.getElementById(`conversion-level-${i}`)?.value || '',
                supportSkills: []
            };
            
            // 获取辅助技能数据（每个光环有4个辅助技能）
            for (let j = 1; j <= 4; j++) {
                const skillSelect = document.getElementById(`support-skill-${i}-${j}`);
                const levelInput = document.getElementById(`support-level-${i}-${j}`);
                
                if (skillSelect && levelInput) {
                    haloData.supportSkills.push({
                        skill: skillSelect.value || '',
                        level: levelInput.value || '20'
                    });
                }
            }
            
            data.haloData.push(haloData);
        }
        
        return data;
    },

    // 封印系统数据设置
    setSealData(data) {
        if (!data) return;
        
        if (data.equipmentSealCompensation) {
            const equipmentSealEl = document.getElementById('equipment-seal-compensation');
            if (equipmentSealEl) equipmentSealEl.value = data.equipmentSealCompensation;
        }
        if (data.otherSealCompensation) {
            const otherSealEl = document.getElementById('other-seal-compensation');
            if (otherSealEl) otherSealEl.value = data.otherSealCompensation;
        }
        
        // 恢复光环数据
        if (data.haloData) {
            data.haloData.forEach((haloData, index) => {
                const i = index + 1;
                
                // 恢复基础封印数值
                if (haloData.baseSeal !== undefined) {
                    const baseSealInput = document.getElementById(`base-seal-${i}`);
                    if (baseSealInput) baseSealInput.value = haloData.baseSeal;
                }
                
                // 恢复封印类型
                if (haloData.sealType) {
                    const sealTypeSelect = document.getElementById(`seal-type-${i}`);
                    if (sealTypeSelect) {
                        sealTypeSelect.value = haloData.sealType;
                        // 手动触发显示逻辑
                        const conversionGroup = document.getElementById(`conversion-group-${i}`);
                        if (conversionGroup) {
                            if (haloData.sealType === 'life') {
                                conversionGroup.style.display = 'block';
                            } else {
                                conversionGroup.style.display = 'none';
                            }
                        }
                    }
                }
                
                // 恢复独辟蹊径空位
                if (haloData.pathfinderSlots) {
                    const pathfinderSelect = document.getElementById(`pathfinder-slots-${i}`);
                    if (pathfinderSelect) pathfinderSelect.value = haloData.pathfinderSlots;
                }
                
                // 恢复封印转化技能
                if (haloData.conversionSkill) {
                    const conversionSelect = document.getElementById(`conversion-skill-${i}`);
                    if (conversionSelect) conversionSelect.value = haloData.conversionSkill;
                }
                
                // 恢复封印转化等级
                if (haloData.conversionLevel) {
                    const conversionLevel = document.getElementById(`conversion-level-${i}`);
                    if (conversionLevel) conversionLevel.value = haloData.conversionLevel;
                }
                
                // 恢复辅助技能数据
                if (haloData.supportSkills && Array.isArray(haloData.supportSkills)) {
                    haloData.supportSkills.forEach((skillData, skillIndex) => {
                        const j = skillIndex + 1;
                        if (j <= 4) { // 确保不超过4个辅助技能
                            const skillSelect = document.getElementById(`support-skill-${i}-${j}`);
                            const levelInput = document.getElementById(`support-level-${i}-${j}`);
                            
                            if (skillSelect && skillData.skill) {
                                skillSelect.value = skillData.skill;
                            }
                            if (levelInput && skillData.level) {
                                levelInput.value = skillData.level;
                            }
                        }
                    });
                }
            });
        }
    },

    // 高塔系统数据获取
    getTowerData() {
        return {
            weaponType: document.querySelector('#tower #weapon-type')?.value || '',
            weaponLevel: document.querySelector('#tower #weapon-level')?.value || '',
            weaponCategory: document.querySelector('#tower #weapon-category')?.value || '',
            researchType: document.getElementById('research-type')?.value || '',
            sequenceInput: document.getElementById('sequence-input')?.value || '',
            basicComponentPrice: document.getElementById('basic-component-price')?.value || '',
            casterComponentPrice: document.getElementById('caster-component-price')?.value || '',
            guardComponentPrice: document.getElementById('guard-component-price')?.value || '',
            sniperComponentPrice: document.getElementById('sniper-component-price')?.value || '',
            defenseComponentPrice: document.getElementById('defense-component-price')?.value || ''
        };
    },

    // 高塔系统数据设置
    setTowerData(data) {
        if (!data) return;
        
        const towerWeaponType = document.querySelector('#tower #weapon-type');
        if (towerWeaponType && data.weaponType) towerWeaponType.value = data.weaponType;
        
        const towerWeaponLevel = document.querySelector('#tower #weapon-level');
        if (towerWeaponLevel && data.weaponLevel) towerWeaponLevel.value = data.weaponLevel;
        
        const towerWeaponCategory = document.querySelector('#tower #weapon-category');
        if (towerWeaponCategory && data.weaponCategory) towerWeaponCategory.value = data.weaponCategory;
        
        const componentFields = [
            { key: 'researchType', id: 'research-type' },
            { key: 'sequenceInput', id: 'sequence-input' },
            { key: 'basicComponentPrice', id: 'basic-component-price' },
            { key: 'casterComponentPrice', id: 'caster-component-price' },
            { key: 'guardComponentPrice', id: 'guard-component-price' },
            { key: 'sniperComponentPrice', id: 'sniper-component-price' },
            { key: 'defenseComponentPrice', id: 'defense-component-price' }
        ];
        
        componentFields.forEach(field => {
            if (data[field.key]) {
                const element = document.getElementById(field.id);
                if (element) element.value = data[field.key];
            }
        });
    }
};

// 将DataPersistence暴露到全局作用域
window.DataPersistence = DataPersistence;

// 自动保存功能
function setupAutoSave() {
    // 为所有输入框添加自动保存事件
    const inputs = document.querySelectorAll('input, select, textarea');
    console.log(`找到 ${inputs.length} 个输入元素，正在设置自动保存`);
    
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            // 延迟保存，避免频繁操作
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(async () => {
                try {
                    await DataPersistence.saveAllData();
                    console.log('数据已自动保存');
                } catch (error) {
                    console.error('自动保存失败:', error);
                }
            }, 1000);
        });
    });
    
    // 页面卸载时保存数据到localStorage
    window.addEventListener('beforeunload', () => {
        try {
            const allData = {
                crafting: DataPersistence.getCraftingData(),
                damage: DataPersistence.getDamageData(),
                dream: DataPersistence.getDreamData(),
                skill: DataPersistence.getSkillData(),
                seal: DataPersistence.getSealData(),
                tower: DataPersistence.getTowerData()
            };
            localStorage.setItem('torchlight-all-data', JSON.stringify(allData));
            console.log('页面卸载时数据已保存到localStorage');
        } catch (error) {
            console.error('页面卸载时保存失败:', error);
        }
    });
}

// 数据持久化初始化已移至 initializeApp 函数中

console.log('火炬之光无限计算器已加载完成！');
console.log('快捷键：Ctrl+Enter 执行计算，Ctrl+S 导出数据');
console.log('高塔系统功能已启用！');
console.log('数据持久化功能已启用！');

// 主题切换功能
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('torch-calculator-theme') || 'light';
        this.themeSwitch = null;
        this.init();
    }

    init() {
        // 等待DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupThemeToggle());
        } else {
            this.setupThemeToggle();
        }
        
        // 应用保存的主题
        this.applyTheme(this.currentTheme);
    }

    setupThemeToggle() {
        this.themeSwitch = document.getElementById('theme-switch');
        if (!this.themeSwitch) {
            console.warn('主题切换开关未找到');
            return;
        }

        // 设置初始状态
        this.themeSwitch.checked = this.currentTheme === 'dark';

        // 添加事件监听器
        this.themeSwitch.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            this.switchTheme(newTheme);
        });

        console.log('主题切换功能已初始化');
    }

    switchTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
        
        // 显示切换通知
        const themeText = theme === 'dark' ? '深色模式' : '浅色模式';
        if (typeof showNotification === 'function') {
            showNotification(`已切换到${themeText}`, 'success');
        }
    }

    applyTheme(theme) {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
    }

    saveTheme(theme) {
        localStorage.setItem('torch-calculator-theme', theme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    // 检测系统主题偏好
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // 监听系统主题变化
    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('torch-calculator-theme')) {
                    const systemTheme = e.matches ? 'dark' : 'light';
                    this.switchTheme(systemTheme);
                    if (this.themeSwitch) {
                        this.themeSwitch.checked = systemTheme === 'dark';
                    }
                }
            });
        }
    }
}

// 初始化主题管理器
const themeManager = new ThemeManager();

// 启用系统主题监听
themeManager.watchSystemTheme();

console.log('主题切换功能已启用！');

// 侧边栏折叠功能
class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.toggleButton = document.getElementById('sidebar-toggle');
        this.isCollapsed = false;
        this.init();
    }

    init() {
        // 从本地存储加载折叠状态
        const savedState = localStorage.getItem('torch-calculator-sidebar-collapsed');
        if (savedState === 'true') {
            this.toggleSidebar(false); // false表示不保存状态，因为是从存储加载
        }

        // 设置点击事件
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.toggleSidebar(true); // true表示保存状态
            });
        }
    }

    toggleSidebar(saveState = true) {
        if (!this.sidebar) return;

        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.sidebar.classList.add('collapsed');
        } else {
            this.sidebar.classList.remove('collapsed');
        }

        // 保存状态到本地存储
        if (saveState) {
            localStorage.setItem('torch-calculator-sidebar-collapsed', this.isCollapsed.toString());
        }

        // 触发窗口resize事件，以便其他组件可以响应布局变化
        window.dispatchEvent(new Event('resize'));
    }

    getSidebarState() {
        return {
            isCollapsed: this.isCollapsed,
            width: this.isCollapsed ? 70 : 200
        };
    }
}

// 初始化侧边栏管理器
const sidebarManager = new SidebarManager();

console.log('侧边栏折叠功能已启用！');

// 伤害系统模块切换功能
function showDamageModule(moduleId) {
    // 隐藏所有模块
    const modules = document.querySelectorAll('.damage-module');
    modules.forEach(module => {
        module.style.display = 'none';
    });
    
    // 移除所有按钮的激活状态
    const buttons = document.querySelectorAll('.function-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的模块
    const targetModule = document.getElementById(moduleId);
    if (targetModule) {
        targetModule.style.display = 'block';
    }
    
    // 激活对应的按钮
    const activeButton = document.querySelector(`[onclick="showDamageModule('${moduleId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// 武器伤害类型切换函数
function switchDamageType(type) {
    // 更新按钮状态
    const physicalBtn = document.getElementById('physical-toggle');
    const elementalBtn = document.getElementById('elemental-toggle');
    
    // 获取输入区域
    const physicalInputs = document.getElementById('physical-damage-inputs');
    const elementalInputs = document.getElementById('elemental-damage-inputs');
    
    if (type === 'physical') {
        physicalBtn.classList.add('active');
        elementalBtn.classList.remove('active');
        
        // 显示物理伤害输入，隐藏元素伤害输入
        physicalInputs.style.display = 'flex';
        elementalInputs.style.display = 'none';
        
        // 重置结果显示
        document.getElementById('weapon-damage-result').innerHTML = `
            <div class="result-item">
                <span class="result-label">基础物理伤害:</span>
                <span class="result-value" id="base-physical-damage">0</span>
            </div>
            <div class="result-item">
                <span class="result-label">武器秒伤:</span>
                <span class="result-value" id="weapon-dps">0</span>
            </div>
            <div class="result-item">
                <span class="result-label">最终物理击中伤害:</span>
                <span class="result-value" id="final-hit-damage">0</span>
            </div>
        `;
    } else {
        elementalBtn.classList.add('active');
        physicalBtn.classList.remove('active');
        
        // 显示元素伤害输入，隐藏物理伤害输入
        physicalInputs.style.display = 'none';
        elementalInputs.style.display = 'flex';
        
        // 重置结果显示为元素伤害结果
        document.getElementById('weapon-damage-result').innerHTML = `
            <div class="elemental-result-row">
                <div class="elemental-icon lightning-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <div class="elemental-title lightning-title">闪电伤害</div>
                <div class="result-item orange-text">
                    <span class="result-label">武器秒伤:</span>
                    <span class="result-value" id="lightning-weapon-dps">0</span>
                </div>
                <div class="result-item orange-text">
                    <span class="result-label">基础伤害:</span>
                    <span class="result-value" id="lightning-base-damage">0</span>
                </div>
                <div class="result-item orange-text">
                    <span class="result-label">击中伤害:</span>
                    <span class="result-value" id="lightning-hit-damage">0</span>
                </div>
            </div>
            <div class="elemental-result-row">
                <div class="elemental-icon cold-icon">
                    <i class="fas fa-snowflake"></i>
                </div>
                <div class="elemental-title cold-title">冰冷伤害</div>
                <div class="result-item blue-text">
                    <span class="result-label">武器秒伤:</span>
                    <span class="result-value" id="cold-weapon-dps">0</span>
                </div>
                <div class="result-item blue-text">
                    <span class="result-label">基础伤害:</span>
                    <span class="result-value" id="cold-base-damage">0</span>
                </div>
                <div class="result-item blue-text">
                    <span class="result-label">击中伤害:</span>
                    <span class="result-value" id="cold-hit-damage">0</span>
                </div>
            </div>
            <div class="elemental-result-row">
                <div class="elemental-icon fire-icon">
                    <i class="fas fa-fire"></i>
                </div>
                <div class="elemental-title fire-title">火焰伤害</div>
                <div class="result-item orange-text">
                    <span class="result-label">武器秒伤:</span>
                    <span class="result-value" id="fire-weapon-dps">0</span>
                </div>
                <div class="result-item orange-text">
                    <span class="result-label">基础伤害:</span>
                    <span class="result-value" id="fire-base-damage">0</span>
                </div>
                <div class="result-item orange-text">
                    <span class="result-label">击中伤害:</span>
                    <span class="result-value" id="fire-hit-damage">0</span>
                </div>
            </div>
            <div class="result-item total-damage orange-text">
                <span class="result-label">总元素击中伤害:</span>
                <span class="result-value" id="total-elemental-damage">0</span>
            </div>
        `;
    }
}

// 武器伤害计算函数
function calculateWeaponDamage() {
    try {
        // 检查当前选择的伤害类型
        const isPhysicalDamage = document.getElementById('physical-toggle').classList.contains('active');
        
        if (isPhysicalDamage) {
            // 物理伤害计算
            calculatePhysicalDamage();
        } else {
            // 元素伤害计算
            calculateElementalDamage();
        }
        
    } catch (error) {
        console.error('武器伤害计算错误:', error);
        showNotification('武器伤害计算出错，请检查输入数据', 'error');
    }
}

function calculatePhysicalDamage() {
    // 获取物理伤害输入值
    const weaponMinDamage = parseFloat(document.getElementById('weapon-min-damage').value) || 0;
    const weaponMaxDamage = parseFloat(document.getElementById('weapon-max-damage').value) || 0;
    const weaponAttackSpeed = parseFloat(document.getElementById('weapon-attack-speed').value) || 1;
    const otherBaseDamage = parseFloat(document.getElementById('other-base-damage').value) || 0;
    const increasedDamage = parseFloat(document.getElementById('increased-damage').value) || 0;
    const moreDamage1 = parseFloat(document.getElementById('more-damage1').value) || 0;
    const moreDamage2 = parseFloat(document.getElementById('more-damage2').value) || 0;
    const moreDamage3 = parseFloat(document.getElementById('more-damage3').value) || 0;
    
    // 输入验证
    if (weaponMinDamage < 0 || weaponMaxDamage < 0) {
        showNotification('武器伤害值不能为负数', 'warning');
        return;
    }
    
    if (weaponMinDamage > weaponMaxDamage) {
        showNotification('武器最小伤害不能大于最大伤害', 'warning');
        return;
    }
    
    if (weaponAttackSpeed <= 0) {
        showNotification('武器攻击速度必须大于0', 'warning');
        return;
    }
    
    // 计算武器秒伤：((武器最小伤害+武器最大伤害)/2)*武器攻击速度
    const weaponDPS = ((weaponMinDamage + weaponMaxDamage) / 2) * weaponAttackSpeed;
    
    // 物理伤害计算：武器秒伤+其他来源提供基础点伤
    const baseDamage = weaponDPS + otherBaseDamage;
    
    // 物理击中伤害：(基础伤害*增加伤害inc)*(1+额外伤害more1)*(1+额外伤害more2)*(1+额外伤害more3)
    const finalHitDamage = (baseDamage * (1 + increasedDamage / 100)) * (1 + moreDamage1 / 100) * (1 + moreDamage2 / 100) * (1 + moreDamage3 / 100);
    
    // 显示结果
    document.getElementById('weapon-dps').textContent = weaponDPS.toFixed(2);
    document.getElementById('base-physical-damage').textContent = baseDamage.toFixed(2);
    document.getElementById('final-hit-damage').textContent = finalHitDamage.toFixed(2);
    
    showNotification('物理伤害计算完成！', 'success');
}

function calculateElementalDamage() {
    // 获取元素伤害攻击速度
    const weaponAttackSpeed = parseFloat(document.getElementById('weapon-attack-speed').value) || 1;
    
    if (weaponAttackSpeed <= 0) {
        showNotification('武器攻击速度必须大于0', 'warning');
        return;
    }
    
    // 闪电伤害计算
    const lightningMinDamage = parseFloat(document.getElementById('weapon-min-lightning').value) || 0;
    const lightningMaxDamage = parseFloat(document.getElementById('weapon-max-lightning').value) || 0;
    const lightningOtherDamage = parseFloat(document.getElementById('other-lightning-damage').value) || 0;
    const lightningIncDamage = parseFloat(document.getElementById('increased-lightning').value) || 0;
    const lightningMore1 = parseFloat(document.getElementById('more-lightning1').value) || 0;
    const lightningMore2 = parseFloat(document.getElementById('more-lightning2').value) || 0;
    const lightningMore3 = parseFloat(document.getElementById('more-lightning3').value) || 0;
    
    // 冰冷伤害计算
    const coldMinDamage = parseFloat(document.getElementById('weapon-min-cold').value) || 0;
    const coldMaxDamage = parseFloat(document.getElementById('weapon-max-cold').value) || 0;
    const coldOtherDamage = parseFloat(document.getElementById('other-cold-damage').value) || 0;
    const coldIncDamage = parseFloat(document.getElementById('increased-cold').value) || 0;
    const coldMore1 = parseFloat(document.getElementById('more-cold1').value) || 0;
    const coldMore2 = parseFloat(document.getElementById('more-cold2').value) || 0;
    const coldMore3 = parseFloat(document.getElementById('more-cold3').value) || 0;
    
    // 火焰伤害计算
    const fireMinDamage = parseFloat(document.getElementById('weapon-min-fire').value) || 0;
    const fireMaxDamage = parseFloat(document.getElementById('weapon-max-fire').value) || 0;
    const fireOtherDamage = parseFloat(document.getElementById('other-fire-damage').value) || 0;
    const fireIncDamage = parseFloat(document.getElementById('increased-fire').value) || 0;
    const fireMore1 = parseFloat(document.getElementById('more-fire1').value) || 0;
    const fireMore2 = parseFloat(document.getElementById('more-fire2').value) || 0;
    const fireMore3 = parseFloat(document.getElementById('more-fire3').value) || 0;
    
    // 输入验证
    if (lightningMinDamage < 0 || lightningMaxDamage < 0 || coldMinDamage < 0 || coldMaxDamage < 0 || fireMinDamage < 0 || fireMaxDamage < 0) {
        showNotification('武器伤害值不能为负数', 'warning');
        return;
    }
    
    if (lightningMinDamage > lightningMaxDamage || coldMinDamage > coldMaxDamage || fireMinDamage > fireMaxDamage) {
        showNotification('武器最小伤害不能大于最大伤害', 'warning');
        return;
    }
    
    // 计算各元素武器秒伤
    const lightningWeaponDPS = ((lightningMinDamage + lightningMaxDamage) / 2) * weaponAttackSpeed;
    const coldWeaponDPS = ((coldMinDamage + coldMaxDamage) / 2) * weaponAttackSpeed;
    const fireWeaponDPS = ((fireMinDamage + fireMaxDamage) / 2) * weaponAttackSpeed;
    
    // 计算各元素基础伤害
    const baseLightningDamage = lightningWeaponDPS + lightningOtherDamage;
    const baseColdDamage = coldWeaponDPS + coldOtherDamage;
    const baseFireDamage = fireWeaponDPS + fireOtherDamage;
    
    // 计算各元素击中伤害
    const lightningHitDamage = (baseLightningDamage * (1 + lightningIncDamage / 100)) * (1 + lightningMore1 / 100) * (1 + lightningMore2 / 100) * (1 + lightningMore3 / 100);
    const coldHitDamage = (baseColdDamage * (1 + coldIncDamage / 100)) * (1 + coldMore1 / 100) * (1 + coldMore2 / 100) * (1 + coldMore3 / 100);
    const fireHitDamage = (baseFireDamage * (1 + fireIncDamage / 100)) * (1 + fireMore1 / 100) * (1 + fireMore2 / 100) * (1 + fireMore3 / 100);
    
    // 计算总元素击中伤害
    const totalElementalDamage = lightningHitDamage + coldHitDamage + fireHitDamage;
    
    // 显示结果
    document.getElementById('lightning-weapon-dps').textContent = lightningWeaponDPS.toFixed(2);
    document.getElementById('lightning-base-damage').textContent = baseLightningDamage.toFixed(2);
    document.getElementById('lightning-hit-damage').textContent = lightningHitDamage.toFixed(2);
    
    document.getElementById('cold-weapon-dps').textContent = coldWeaponDPS.toFixed(2);
    document.getElementById('cold-base-damage').textContent = baseColdDamage.toFixed(2);
    document.getElementById('cold-hit-damage').textContent = coldHitDamage.toFixed(2);
    
    document.getElementById('fire-weapon-dps').textContent = fireWeaponDPS.toFixed(2);
    document.getElementById('fire-base-damage').textContent = baseFireDamage.toFixed(2);
    document.getElementById('fire-hit-damage').textContent = fireHitDamage.toFixed(2);
    
    document.getElementById('total-elemental-damage').textContent = totalElementalDamage.toFixed(2);
    
    showNotification('元素伤害计算完成！', 'success');
}

// 麻痹计算函数
function calculateParalysis() {
    try {
        const layers = parseInt(document.getElementById('paralysis-layers').value) || 0;
        const effect = parseFloat(document.getElementById('paralysis-effect').value) || 0;
        const conductive = document.getElementById('conductive').checked;

        // 计算基础效果
        let baseEffect;
        if (conductive) {
            // 导电状态：基础效果为10%每层
            baseEffect = 10;
        } else {
            // 普通状态：基础效果为5%每层
            baseEffect = 5;
        }
        
        // 计算原始总伤害倍率：1 + 麻痹基础效果 * 麻痹层数
        const originalMultiplier = 1 + (baseEffect * layers / 100);
        
        // 计算加成后总伤害倍率：1 + 麻痹基础效果 * 麻痹层数 * (1 + 麻痹效果%)
        const enhancedMultiplier = 1 + (baseEffect * layers * (1 + effect / 100) / 100);
        
        // 计算当前麻痹效果增伤：(加成后倍率 - 原始倍率) / 原始倍率
        const currentParalysisIncrease = ((enhancedMultiplier - originalMultiplier) / originalMultiplier) * 100;
        
        // 计算麻痹总增伤（加成后的总效果百分比）
        const totalParalysisIncrease = (enhancedMultiplier - 1) * 100;
        
        // 应用麻痹效果加成到单层效果
        const enhancedBaseEffect = baseEffect * (1 + effect / 100);

        // 显示结果
        document.getElementById('paralysis-result').textContent = `麻痹总增伤：${totalParalysisIncrease.toFixed(1)}%`;
        document.getElementById('current-paralysis-effect').textContent = `${currentParalysisIncrease.toFixed(1)}%`;

        console.log('麻痹计算完成');
        
    } catch (error) {
        console.error('麻痹计算错误:', error);
        showNotification('麻痹计算出错，请检查输入数据', 'error');
    }
}

// 初始化伤害系统模块切换
document.addEventListener('DOMContentLoaded', function() {
    // 默认显示第一个模块
    showDamageModule('damage-reduction-module');
});

console.log('伤害系统模块功能已启用！');

// 鼠标滚轮调整数值功能
function handleWheelAdjust(event, input, step) {
    event.preventDefault();
    
    const currentValue = parseFloat(input.value) || 0;
    const delta = event.deltaY > 0 ? -step : step;
    const newValue = Math.max(0, currentValue + delta);
    
    input.value = newValue;
    
    // 触发input事件以更新计算
    const inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);
}

// 贯注计算功能
function updateFocusInputs() {
    const focusType = document.getElementById('focus-type').value;
    const movementSpeedGroup = document.getElementById('movement-speed-group');
    const painCheckboxGroup = document.getElementById('pain-checkbox-group');
    
    // 隐藏所有特殊输入
    movementSpeedGroup.style.display = 'none';
    painCheckboxGroup.style.display = 'none';
    
    // 根据贯注类型显示对应输入
    if (focusType === 'thunder') {
        movementSpeedGroup.style.display = 'block';
    } else if (focusType === 'sharp') {
        painCheckboxGroup.style.display = 'block';
    }
    
    // 更新规则说明
    updateFocusRuleText(focusType);
    
    // 重新计算
    calculateFocus();
}

function updateFocusRuleText(focusType) {
    const ruleText = document.getElementById('focus-rule-text');
    const rules = {
        'sharp': '锐利贯注：近战攻击击中时获得25点贯注值，该效果有0.2秒间隔。贯注值达到100时，下一次近战攻击击中时，消耗全部贯注值。',
        'ice': '寒冰贯注：对冰结敌人造成伤害时获得20点贯注值，间隔0.4秒；寒冰风暴存在期间，无法以此方式获得贯注值。贯注值达到100后，创造一片跟随角色移动的寒冰风暴。',
        'thunder': '雷霆贯注：每移动2米获得5点贯注值。贯注值达到100后，使用非位移攻击技能会消耗全部贯注值并向前触发该技能，降下雷击打击一定范围内的每个敌人。\n\n移动所需时间 = 需要移动的距离 / 每秒移动距离\n每秒移动距离 = 玩家基础移动速度 × (1 + 移动速度加成%)\n玩家基础移动速度默认6.5米每秒。',
        'erosion': '侵蚀贯注：每隔0.1秒获得6.5点贯注值。贯注值达到100后，使用主动技能会向敌人触发该技能，发射一颗持续追踪敌人的侵蚀法球。',
        'fire': '熔火贯注：点燃敌人时获得12点贯注值，该效果每0.5秒至多触发3次。击败敌人时，消耗40点贯注值并在敌人位置触发该技能，引发爆炸。'
    };
    
    ruleText.textContent = rules[focusType] || '请选择贯注类型查看详细规则';
}

function calculateFocus() {
    const focusType = document.getElementById('focus-type').value;
    const speedInc = parseFloat(document.getElementById('focus-speed-inc').value) || 0;
    const speedMore1 = parseFloat(document.getElementById('focus-speed-more1').value) || 0;
    const speedMore2 = parseFloat(document.getElementById('focus-speed-more2').value) || 0;
    const movementSpeed = parseFloat(document.getElementById('movement-speed').value) || 0;
    const sharpPain = document.getElementById('sharp-pain').checked;
    const dullPain = document.getElementById('dull-pain').checked;
    
    const resultDiv = document.getElementById('focus-result');
    const valueDisplay = document.getElementById('focus-value-display');
    const tierDisplay = document.getElementById('focus-tier-display');
    
    if (!focusType) {
        resultDiv.textContent = '请选择贯注类型';
        valueDisplay.textContent = '';
        tierDisplay.textContent = '';
        return;
    }
    
    // 计算贯注速度加成（多个more相乘）
    const totalSpeedBonus = (1 + speedInc / 100) * (1 + speedMore1 / 100) * (1 + speedMore2 / 100);
    
    // 基础贯注值
    const baseFocusValues = {
        'sharp': 25,
        'ice': 20,
        'thunder': 5,
        'erosion': 6.5,
        'fire': 12
    };
    
    const baseFocusValue = baseFocusValues[focusType];
    const actualFocusValue = baseFocusValue * totalSpeedBonus;
    
    // 计算贯注上限和触发值
    let focusLimit = 100;
    let triggerValue = 100;
    
    if (focusType === 'sharp') {
        if (sharpPain) {
            focusLimit = 120;
            triggerValue = 120;
        }
        if (dullPain) {
            focusLimit += 30;
            triggerValue += 30;
        }
    }
    
    // 显示基本信息
    let resultText = '';
    let valueText = '';
    let tierText = '';
    
    switch (focusType) {
        case 'sharp':
            resultText = `每次攻击获得 ${actualFocusValue.toFixed(1)} 点贯注值`;
            valueText = `贯注上限：${focusLimit} 点，触发值：${triggerValue} 点`;
            
            // 计算锐利贯注档位
            const attacksToTrigger = Math.ceil(triggerValue / actualFocusValue);
            if (attacksToTrigger <= 1) {
                tierText = '档位：每1次攻击都触发贯注';
            } else {
                tierText = `档位：每${attacksToTrigger}次攻击触发1次贯注`;
            }
            break;
            
        case 'ice':
            resultText = `每次对冰结敌人造成伤害获得 ${actualFocusValue.toFixed(1)} 点贯注值`;
            valueText = `贯注上限：${focusLimit} 点，触发值：${triggerValue} 点`;
            tierText = `需要 ${Math.ceil(triggerValue / actualFocusValue)} 次伤害触发寒冰风暴`;
            break;
            
        case 'thunder':
            const focusPerMeter = actualFocusValue / 2; // 每2米获得5点，所以每米2.5点
            const metersToTrigger = triggerValue / focusPerMeter;
            
            // 玩家基础移动速度默认6.5米每秒
            const baseMovementSpeed = 6.5;
            const actualMovementSpeed = baseMovementSpeed * (1 + movementSpeed / 100);
            const distancePerSecond = actualMovementSpeed;
            
            resultText = `每移动1米获得 ${focusPerMeter.toFixed(1)} 点贯注值`;
            valueText = `贯注上限：${focusLimit} 点，触发值：${triggerValue} 点`;
            tierText = `需要移动 ${metersToTrigger.toFixed(1)} 米触发雷击`;
            
            if (movementSpeed > 0) {
                const timeToTrigger = metersToTrigger / actualMovementSpeed;
                tierText += ` (约 ${timeToTrigger.toFixed(1)} 秒)`;
                tierText += `\n每秒移动距离：${distancePerSecond.toFixed(1)} 米`;
            } else {
                tierText += `\n每秒移动距离：${baseMovementSpeed.toFixed(1)} 米 (基础速度)`;
            }
            break;
            
        case 'erosion':
            const timeToTrigger = triggerValue / actualFocusValue * 0.1; // 每0.1秒获得一次
            resultText = `每0.1秒获得 ${actualFocusValue.toFixed(1)} 点贯注值`;
            valueText = `贯注上限：${focusLimit} 点，触发值：${triggerValue} 点`;
            tierText = `需要 ${timeToTrigger.toFixed(1)} 秒触发侵蚀法球`;
            break;
            
        case 'fire':
            const ignitionsToTrigger = Math.ceil(triggerValue / actualFocusValue);
            resultText = `每次点燃敌人获得 ${actualFocusValue.toFixed(1)} 点贯注值`;
            valueText = `贯注上限：${focusLimit} 点，消耗值：40 点`;
            tierText = `需要 ${ignitionsToTrigger} 次点燃达到触发值`;
            break;
    }
    
    resultDiv.textContent = resultText;
    valueDisplay.textContent = valueText;
    tierDisplay.textContent = tierText;
}

// 打造系统模块切换功能
function showCraftingModule(moduleId) {
    // 隐藏所有打造模块
    const modules = document.querySelectorAll('.crafting-module');
    modules.forEach(module => {
        module.style.display = 'none';
    });
    
    // 移除所有按钮的激活状态
    const buttons = document.querySelectorAll('#crafting .function-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的模块
    const targetModule = document.getElementById(moduleId);
    if (targetModule) {
        targetModule.style.display = 'block';
    }
    
    // 激活对应的按钮
    const activeButton = document.querySelector(`[onclick="showCraftingModule('${moduleId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// 初始化打造系统模块切换
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保DOM完全加载
    setTimeout(() => {
        // 默认显示装备打造模块
        showCraftingModule('equipment-crafting');
        // 初始化侵蚀模拟功能
        initializeErosionSimulation();
    }, 500);
});

// 梦境装备数据结构完全结束

// 侵蚀模拟功能
let legendaryEquipmentData = {};
let mutationAffixData = [];
let erosionStats = {
    count: 0,
    darkCoreUsed: 0,
    demonCoreUsed: 0,
    totalCost: 0,
    // 新增侵蚀结果统计
    results: {
        mutation: 0,    // 异化
        chaos: 0,       // 混沌
        profane: 0,     // 亵渎
        pride: 0,       // 傲慢
        void: 0         // 虚无
    }
};
let currentEquipment = null;
let currentAffixes = {
    base: [],
    normal: [],
    erosion: []
};

// 武器子类型映射
const weaponSubtypes = {
    '单手': ['爪', '匕首', '单手剑', '单手锤', '单手斧', '法杖', '灵杖', '魔杖', '手杖', '手枪'],
    '双手': ['双手剑', '双手锤', '双手斧', '锡杖', '武杖', '弓', '弩', '火枪', '火炮']
};

// 加载传奇装备数据
async function loadLegendaryEquipmentData() {
    try {
        const response = await fetch('传奇装备.json');
        legendaryEquipmentData = await response.json();
        console.log('传奇装备数据加载成功');
    } catch (error) {
        console.error('加载传奇装备数据失败:', error);
        showNotification('加载传奇装备数据失败', 'error');
    }
}

// 加载异化词缀数据
async function loadMutationAffixData() {
    try {
        const response = await fetch('异化.txt');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        
        // 解析异化词缀数据，提取实际的词缀内容
        const lines = text.split('\n').filter(line => line.trim() !== '');
        mutationAffixData = [];
        
        for (const line of lines) {
            // 跳过装备类型标题行
            if (line.includes('头部') || line.includes('胸甲') || line.includes('手套') || line.includes('鞋子') || 
                line.includes('爪') || line.includes('匕首') || line.includes('剑') || line.includes('锤') || 
                line.includes('斧') || line.includes('杖') || line.includes('弓') || line.includes('枪') || line.includes('炮')) {
                continue;
            }
            
            // 提取词缀内容（去除几率信息）
            let cleanAffix = line.trim();
            
            // 去除词缀编号
            cleanAffix = cleanAffix.replace(/^词缀\d+：/, '');
            
            // 去除几率信息（支持多种格式）
            cleanAffix = cleanAffix.replace(/\s*几率：[\d.%]+\s*$/, '');
            cleanAffix = cleanAffix.replace(/\s+[\d.%]+\s*$/, '');
            cleanAffix = cleanAffix.replace(/\t[\d.%]+\s*$/, '');
            
            // 清理制表符和多余空格
            cleanAffix = cleanAffix.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
            
            if (cleanAffix && cleanAffix.length > 0) {
                mutationAffixData.push(cleanAffix);
            }
        }
        
        console.log('异化词缀数据加载成功，共', mutationAffixData.length, '条词缀');
    } catch (error) {
        console.error('加载异化词缀数据失败:', error);
        showNotification('加载异化词缀失败', 'error');
    }
}

// 初始化侵蚀模拟功能
async function initializeErosionSimulation() {
    try {
        // 先加载数据
        await loadLegendaryEquipmentData();
        await loadMutationAffixData();
        
        // 数据加载完成后，初始化装备类型选项
        initializeEquipmentTypeOptions();
        
        // 绑定装备类型选择事件
        const equipmentTypeSelect = document.getElementById('equipment-type');
        if (equipmentTypeSelect) {
            equipmentTypeSelect.addEventListener('change', onEquipmentTypeChange);
        }
        
        // 绑定武器子类型选择事件
        const weaponSubtypeSelect = document.getElementById('weapon-subtype');
        if (weaponSubtypeSelect) {
            weaponSubtypeSelect.addEventListener('change', onWeaponSubtypeChange);
        }
        
        // 绑定装备名称选择事件
        const equipmentNameSelect = document.getElementById('equipment-name');
        if (equipmentNameSelect) {
            equipmentNameSelect.addEventListener('change', onEquipmentNameChange);
        }
        
        console.log('侵蚀模拟功能初始化完成');
    } catch (error) {
        console.error('侵蚀模拟功能初始化失败:', error);
    }
}

// 初始化装备类型选项
function initializeEquipmentTypeOptions() {
    const equipmentTypeSelect = document.getElementById('equipment-type');
    
    if (!equipmentTypeSelect) {
        console.error('找不到装备类型选择框元素');
        return;
    }
    
    if (!legendaryEquipmentData || !legendaryEquipmentData.装备数据) {
        console.warn('传奇装备数据未加载，保留HTML中的默认选项');
        return;
    }
    
    // 保存当前选中的值
    const currentValue = equipmentTypeSelect.value;
    
    // 检查是否已经有选项（避免重复初始化）
    const existingOptions = Array.from(equipmentTypeSelect.options).map(opt => opt.value).filter(val => val !== '');
    
    // 从JSON数据中获取所有装备类型
    const equipmentTypes = Object.keys(legendaryEquipmentData.装备数据);
    
    // 只添加不存在的选项
    equipmentTypes.forEach(type => {
        if (!existingOptions.includes(type)) {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            equipmentTypeSelect.appendChild(option);
        }
    });
    
    // 恢复之前选中的值
    if (currentValue) {
        equipmentTypeSelect.value = currentValue;
    }
    
    console.log('装备类型选项初始化完成，共加载', equipmentTypes.length, '个类型');
}

// 装备类型选择变化处理
function onEquipmentTypeChange() {
    const equipmentType = document.getElementById('equipment-type').value;
    const weaponSubtypeGroup = document.getElementById('weapon-subtype-group');
    const weaponSubtypeSelect = document.getElementById('weapon-subtype');
    const equipmentNameSelect = document.getElementById('equipment-name');
    
    // 清空装备名称选择
    equipmentNameSelect.innerHTML = '<option value="">请先选择装备类型</option>';
    
    if (equipmentType === '单手' || equipmentType === '双手') {
        // 显示武器子类型选择
        weaponSubtypeGroup.style.display = 'block';
        
        // 填充武器子类型选项
        weaponSubtypeSelect.innerHTML = '<option value="">请选择武器类型</option>';
        const subtypes = weaponSubtypes[equipmentType] || [];
        subtypes.forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype;
            option.textContent = subtype;
            weaponSubtypeSelect.appendChild(option);
        });
    } else {
        // 隐藏武器子类型选择
        weaponSubtypeGroup.style.display = 'none';
        weaponSubtypeSelect.innerHTML = '<option value="">请选择武器类型</option>';
        
        // 直接加载装备名称
        loadEquipmentNames(equipmentType);
    }
    
    // 清空装备显示
    clearEquipmentDisplay();
}

// 武器子类型选择变化处理
function onWeaponSubtypeChange() {
    const weaponSubtype = document.getElementById('weapon-subtype').value;
    if (weaponSubtype) {
        loadEquipmentNames(weaponSubtype);
    }
    clearEquipmentDisplay();
}

// 装备名称选择变化处理
function onEquipmentNameChange() {
    const equipmentName = document.getElementById('equipment-name').value;
    if (equipmentName) {
        loadEquipmentData(equipmentName);
    } else {
        clearEquipmentDisplay();
    }
}

// 加载装备名称列表
function loadEquipmentNames(equipmentType) {
    const equipmentNameSelect = document.getElementById('equipment-name');
    equipmentNameSelect.innerHTML = '<option value="">请选择装备</option>';
    
    if (legendaryEquipmentData.装备数据 && legendaryEquipmentData.装备数据[equipmentType]) {
        const equipmentList = legendaryEquipmentData.装备数据[equipmentType];
        equipmentList.forEach(equipment => {
            const option = document.createElement('option');
            // 兼容两种字段名：装备名称 和 名称
            const equipmentName = equipment.装备名称 || equipment.名称;
            if (equipmentName) {
                option.value = equipmentName;
                option.textContent = equipmentName;
                equipmentNameSelect.appendChild(option);
            }
        });
        console.log(`已加载 ${equipmentType} 类型的 ${equipmentList.length} 个装备`);
    } else {
        console.warn(`未找到装备类型: ${equipmentType}`);
    }
}

// 加载装备数据
function loadEquipmentData(equipmentName) {
    // 在所有装备类型中查找指定名称的装备
    let foundEquipment = null;
    let equipmentType = null;
    
    if (legendaryEquipmentData.装备数据) {
        for (const [type, equipmentList] of Object.entries(legendaryEquipmentData.装备数据)) {
            const equipment = equipmentList.find(item => 
                (item.装备名称 === equipmentName) || (item.名称 === equipmentName)
            );
            if (equipment) {
                foundEquipment = equipment;
                equipmentType = type;
                break;
            }
        }
    }
    
    if (foundEquipment) {
        currentEquipment = foundEquipment;
        // 处理基础词缀，兼容字符串和数组格式
        let baseAffixes = [];
        if (foundEquipment.基础词缀) {
            if (Array.isArray(foundEquipment.基础词缀)) {
                baseAffixes = [...foundEquipment.基础词缀];
            } else {
                baseAffixes = [foundEquipment.基础词缀];
            }
        }
        
        currentAffixes = {
            base: baseAffixes,
            normal: [...(foundEquipment.普通词缀 || [])],
            erosion: [],
            erosionMarks: { base: [], normal: [] },
            mutationMarks: { base: [], normal: [] },
            profaneMarks: { base: [], normal: [] }
        };
        
        displayEquipment(foundEquipment, equipmentType);
        console.log(`已加载装备: ${equipmentName}，类型: ${equipmentType}`);
    } else {
        console.error(`未找到装备: ${equipmentName}`);
        clearEquipmentDisplay();
    }
}

// 显示装备信息
function displayEquipment(equipment, equipmentType) {
    // 更新装备图标
    const equipmentImage = document.getElementById('equipment-image');
    const placeholderIcon = document.querySelector('.placeholder-icon');
    
    // 获取装备名称（兼容两种字段名）
    const equipmentName = equipment.装备名称 || equipment.名称;
    
    // 构建图片路径，尝试多种可能的路径
    const possiblePaths = [
        `传奇/${equipmentName}.webp`,
        `传奇/${encodeURIComponent(equipmentName)}.webp`,
        `images/传奇/${equipmentName}.webp`,
        `images/传奇/${encodeURIComponent(equipmentName)}.webp`
    ];
    
    // 尝试加载第一个路径
    equipmentImage.src = possiblePaths[0];
    equipmentImage.style.display = 'block';
    placeholderIcon.style.display = 'none';
    
    // 处理图片加载失败，尝试其他路径
    let pathIndex = 0;
    equipmentImage.onerror = function() {
        pathIndex++;
        if (pathIndex < possiblePaths.length) {
            this.src = possiblePaths[pathIndex];
        } else {
            // 所有路径都失败，显示占位符
            this.style.display = 'none';
            placeholderIcon.style.display = 'flex';
            console.warn(`无法加载装备图片: ${equipmentName}`);
        }
    };
    
    // 更新装备信息
    document.getElementById('display-equipment-name').textContent = equipmentName;
    document.getElementById('display-equipment-level').textContent = `等级: ${equipment.需求等级}`;
    
    // 显示词缀
    displayAffixes();
}

// 显示词缀
function displayAffixes() {
    // 显示基础词缀
    const baseAffixesDiv = document.getElementById('base-affixes');
    baseAffixesDiv.innerHTML = '';
    if (currentAffixes.base.length > 0) {
        currentAffixes.base.forEach((affix, index) => {
            const p = document.createElement('p');
            p.textContent = affix;
            // 检查是否为混沌词缀（不使用流光效果）
            if (currentAffixes.chaosMarks && currentAffixes.chaosMarks.base[index]) {
                p.style.color = '#ff6b6b';
                p.style.fontWeight = 'bold';
            }
            // 检查是否为已侵蚀词缀
            else if (currentAffixes.erosionMarks && currentAffixes.erosionMarks.base[index]) {
                p.className = 'corrupted-affix';
                p.style.color = '#ff6b6b';
                p.style.fontWeight = 'bold';
            }
            // 检查是否为异化词缀
            else if (currentAffixes.mutationMarks && currentAffixes.mutationMarks.base[index]) {
                p.className = 'mutation-affix';
            }
            // 检查是否为亵渎词缀
            else if (currentAffixes.profaneMarks && currentAffixes.profaneMarks.base[index]) {
                p.className = 'profane-affix';
            }
            baseAffixesDiv.appendChild(p);
        });
    } else {
        baseAffixesDiv.innerHTML = '<p class="no-affixes">无基础词缀</p>';
    }
    
    // 显示普通词缀
    const normalAffixesDiv = document.getElementById('normal-affixes');
    normalAffixesDiv.innerHTML = '';
    if (currentAffixes.normal.length > 0) {
        currentAffixes.normal.forEach((affix, index) => {
            const p = document.createElement('p');
            p.textContent = affix;
            // 检查是否为混沌词缀（不使用流光效果）
            if (currentAffixes.chaosMarks && currentAffixes.chaosMarks.normal[index]) {
                p.style.color = '#ff6b6b';
                p.style.fontWeight = 'bold';
            }
            // 检查是否为已侵蚀词缀
            else if (currentAffixes.erosionMarks && currentAffixes.erosionMarks.normal[index]) {
                p.className = 'corrupted-affix';
                p.style.color = '#ff6b6b';
                p.style.fontWeight = 'bold';
            }
            // 检查是否为异化词缀
            else if (currentAffixes.mutationMarks && currentAffixes.mutationMarks.normal[index]) {
                p.className = 'mutation-affix';
            }
            // 检查是否为亵渎词缀
            else if (currentAffixes.profaneMarks && currentAffixes.profaneMarks.normal[index]) {
                p.className = 'profane-affix';
            }
            normalAffixesDiv.appendChild(p);
        });
    } else {
        normalAffixesDiv.innerHTML = '<p class="no-affixes">无普通词缀</p>';
    }
    
    // 隐藏已侵蚀词缀单独显示区域
    const erosionAffixesSection = document.getElementById('erosion-affixes-section');
    erosionAffixesSection.style.display = 'none';
}

// 清空装备显示
function clearEquipmentDisplay() {
    document.getElementById('equipment-image').style.display = 'none';
    document.querySelector('.placeholder-icon').style.display = 'flex';
    document.getElementById('display-equipment-name').textContent = '请选择装备';
    document.getElementById('display-equipment-level').textContent = '等级: --';
    
    document.getElementById('base-affixes').innerHTML = '<p class="no-affixes">请选择装备</p>';
    document.getElementById('normal-affixes').innerHTML = '<p class="no-affixes">请选择装备</p>';
    document.getElementById('erosion-affixes-section').style.display = 'none';
    document.getElementById('equipment-status').style.display = 'none';
    
    currentEquipment = null;
    currentAffixes = { 
        base: [], 
        normal: [], 
        erosion: [], 
        erosionMarks: { base: [], normal: [] },
        mutationMarks: { base: [], normal: [] },
        profaneMarks: { base: [], normal: [] }
    };
}

// 重置装备状态为初始状态
function resetEquipmentToInitialState() {
    if (!currentEquipment) return;
    
    // 处理基础词缀，兼容字符串和数组格式
    let baseAffixes = [];
    if (currentEquipment.基础词缀) {
        if (Array.isArray(currentEquipment.基础词缀)) {
            baseAffixes = [...currentEquipment.基础词缀];
        } else {
            baseAffixes = [currentEquipment.基础词缀];
        }
    }
    
    // 重新加载装备的初始词缀
    currentAffixes = {
        base: baseAffixes,
        normal: [...(currentEquipment.普通词缀 || [])],
        erosion: [],
        erosionMarks: {
            base: new Array(baseAffixes.length).fill(false),
            normal: new Array((currentEquipment.普通词缀 || []).length).fill(false)
        },
        mutationMarks: {
            base: new Array(baseAffixes.length).fill(false),
            normal: new Array((currentEquipment.普通词缀 || []).length).fill(false)
        },
        profaneMarks: {
            base: new Array(baseAffixes.length).fill(false),
            normal: new Array((currentEquipment.普通词缀 || []).length).fill(false)
        }
    };
    
    // 隐藏装备状态
    document.getElementById('equipment-status').style.display = 'none';
}

// 执行侵蚀
function performErosion(erosionType) {
    if (!currentEquipment) {
        showNotification('请先选择装备', 'warning');
        return;
    }
    
    // 重置装备状态为初始状态
    resetEquipmentToInitialState();
    
    // 重置侵蚀结果显示
    document.getElementById('erosion-result-area').style.display = 'none';
    
    // 获取价格设置
    const equipmentPrice = parseFloat(document.getElementById('equipment-price').value) || 0;
    const darkCorePrice = parseFloat(document.getElementById('dark-core-price').value) || 0;
    const demonCorePrice = parseFloat(document.getElementById('demon-core-price').value) || 0;
    
    if (darkCorePrice <= 0 || demonCorePrice <= 0) {
        showNotification('请设置正确的核心价格', 'warning');
        return;
    }
    
    // 获取装备等级
    const equipmentLevel = parseInt(document.getElementById('equipment-level-erosion').value);
    
    // 计算消耗
    let darkCoreConsumption = 0;
    let demonCoreConsumption = 0;
    
    if (erosionType === 'dark') {
        // 黑暗侵蚀
        darkCoreConsumption = equipmentLevel > 82 ? 7 : 4;
    } else if (erosionType === 'deepest') {
        // 至暗侵蚀
        demonCoreConsumption = 1;
    }
    
    // 更新统计
    erosionStats.count++;
    erosionStats.darkCoreUsed += darkCoreConsumption;
    erosionStats.demonCoreUsed += demonCoreConsumption;
    
    // 计算成本
    const currentCost = (darkCoreConsumption * darkCorePrice) + (demonCoreConsumption * demonCorePrice) + equipmentPrice;
    erosionStats.totalCost += currentCost;
    
    // 执行侵蚀逻辑
    const result = executeErosionLogic(erosionType);
    
    // 更新显示
    updateErosionStats();
    displayErosionResult(result, erosionType);
    displayAffixes();
    
    showNotification(`${erosionType === 'dark' ? '黑暗' : '至暗'}侵蚀完成！结果：${result}`, 'success');
}

// 执行侵蚀逻辑
function executeErosionLogic(erosionType) {
    let probabilities;
    
    if (erosionType === 'dark') {
        // 黑暗侵蚀概率
        probabilities = {
            '异化': 0.25,
            '混沌': 0.25,
            '傲慢': 0.30,
            '虚无': 0.20
        };
    } else {
        // 至暗侵蚀概率
        probabilities = {
            '异化': 0.30,
            '混沌': 0.30,
            '亵渎': 0.15,
            '傲慢': 0.15,
            '虚无': 0.10
        };
    }
    
    // 随机选择结果
    const random = Math.random();
    let cumulative = 0;
    let result = '虚无';
    
    for (const [outcome, probability] of Object.entries(probabilities)) {
        cumulative += probability;
        if (random <= cumulative) {
            result = outcome;
            break;
        }
    }
    
    // 应用侵蚀效果
    applyErosionEffect(result);
    
    return result;
}

// 应用侵蚀效果
function applyErosionEffect(result) {
    const equipmentStatus = document.getElementById('equipment-status');
    
    // 更新侵蚀结果统计
    switch (result) {
        case '异化':
            erosionStats.results.mutation++;
            // 添加异化词缀
            if (mutationAffixData.length > 0) {
                const randomMutationAffix = mutationAffixData[Math.floor(Math.random() * mutationAffixData.length)];
                currentAffixes.base.push(randomMutationAffix);
                // 标记新添加的词缀为异化词缀
                if (!currentAffixes.mutationMarks) {
                    currentAffixes.mutationMarks = {
                        base: new Array(currentAffixes.base.length - 1).fill(false),
                        normal: new Array(currentAffixes.normal.length).fill(false)
                    };
                }
                currentAffixes.mutationMarks.base.push(true);
            }
            // 显示已绑定状态
            equipmentStatus.innerHTML = '<p class="bound-status">已绑定</p>';
            equipmentStatus.style.display = 'block';
            break;
            
        case '混沌':
            erosionStats.results.chaos++;
            // 处理混沌侵蚀：随机选择一个词缀并随机化其数值
            applyChaosEffect();
            // 显示已绑定状态
            equipmentStatus.innerHTML = '<p class="bound-status">已绑定</p>';
            equipmentStatus.style.display = 'block';
            break;
            
        case '亵渎':
            erosionStats.results.profane++;
            // 随机2条词缀替换为已侵蚀词缀
            upgradeRandomAffixes(2);
            // 标记亵渎词缀
            if (!currentAffixes.profaneMarks) {
                currentAffixes.profaneMarks = {
                    base: new Array(currentAffixes.base.length).fill(false),
                    normal: new Array(currentAffixes.normal.length).fill(false)
                };
            }
            // 标记最近升级的词缀为亵渎词缀
            markRecentUpgradesAsProfane(2);
            break;
            
        case '傲慢':
            erosionStats.results.pride++;
            // 随机1条词缀替换为已侵蚀词缀
            upgradeRandomAffixes(1);
            break;
            
        case '虚无':
            erosionStats.results.void++;
            // 显示已绑定状态
            equipmentStatus.innerHTML = '<p class="bound-status">已绑定</p>';
            equipmentStatus.style.display = 'block';
            break;
    }
}

// 标记最近升级的词缀为亵渎词缀
function markRecentUpgradesAsProfane(count) {
    // 这个函数需要在upgradeRandomAffixes函数中记录哪些词缀被升级了
    // 由于upgradeRandomAffixes函数的实现细节，我们需要修改它来支持亵渎标记
}

// 应用混沌效果：随机选择词缀并随机化数值
function applyChaosEffect() {
    const allAffixes = [...currentAffixes.base, ...currentAffixes.normal];
    if (allAffixes.length === 0) return;
    
    // 随机选择一个词缀
    const randomIndex = Math.floor(Math.random() * allAffixes.length);
    const selectedAffix = allAffixes[randomIndex];
    
    // 检查词缀是否包含括号数值范围
    const bracketRegex = /\((\d+)–(\d+)\)/g;
    let modifiedAffix = selectedAffix;
    
    // 替换所有括号中的数值范围
    modifiedAffix = modifiedAffix.replace(bracketRegex, (match, min, max) => {
        const minVal = parseInt(min);
        const maxVal = parseInt(max);
        const randomVal = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        return `(${randomVal})`;
    });
    
    // 更新词缀
    const baseIndex = currentAffixes.base.indexOf(selectedAffix);
    const normalIndex = currentAffixes.normal.indexOf(selectedAffix);
    
    if (baseIndex !== -1) {
        currentAffixes.base[baseIndex] = modifiedAffix;
        // 标记为混沌词缀（不使用流光效果）
        if (!currentAffixes.chaosMarks) {
            currentAffixes.chaosMarks = {
                base: new Array(currentAffixes.base.length).fill(false),
                normal: new Array(currentAffixes.normal.length).fill(false)
            };
        }
        currentAffixes.chaosMarks.base[baseIndex] = true;
    } else if (normalIndex !== -1) {
        currentAffixes.normal[normalIndex] = modifiedAffix;
        // 标记为混沌词缀（不使用流光效果）
        if (!currentAffixes.chaosMarks) {
            currentAffixes.chaosMarks = {
                base: new Array(currentAffixes.base.length).fill(false),
                normal: new Array(currentAffixes.normal.length).fill(false)
            };
        }
        currentAffixes.chaosMarks.normal[normalIndex] = true;
    }
}

// 升级随机词缀为已侵蚀词缀
function upgradeRandomAffixes(count) {
    if (!currentEquipment || !currentEquipment.已侵蚀词缀) {
        console.warn('当前装备没有已侵蚀词缀数据');
        return;
    }
    
    const allAffixes = [...currentAffixes.base, ...currentAffixes.normal];
    if (allAffixes.length === 0) return;
    
    // 初始化已侵蚀词缀标记数组
    if (!currentAffixes.erosionMarks) {
        currentAffixes.erosionMarks = {
            base: new Array(currentAffixes.base.length).fill(false),
            normal: new Array(currentAffixes.normal.length).fill(false)
        };
    }
    
    const erodedAffixes = Array.isArray(currentEquipment.已侵蚀词缀) ? currentEquipment.已侵蚀词缀 : [];
    const originalNormalAffixes = Array.isArray(currentEquipment.普通词缀) ? currentEquipment.普通词缀 : [];
    
    for (let i = 0; i < count && allAffixes.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * allAffixes.length);
        const selectedAffix = allAffixes[randomIndex];
        
        // 查找对应的已侵蚀词缀
        const baseIndex = currentAffixes.base.indexOf(selectedAffix);
        const normalIndex = currentAffixes.normal.indexOf(selectedAffix);
        
        if (baseIndex !== -1) {
            // 基础词缀不应该被替换为已侵蚀词缀，只标记
            currentAffixes.erosionMarks.base[baseIndex] = true;
        } else if (normalIndex !== -1) {
            // 查找原始普通词缀在装备数据中的位置
            const originalIndex = originalNormalAffixes.indexOf(selectedAffix);
            if (originalIndex !== -1 && erodedAffixes.length > originalIndex) {
                // 替换为对应的已侵蚀词缀
                currentAffixes.normal[normalIndex] = erodedAffixes[originalIndex];
            }
            currentAffixes.erosionMarks.normal[normalIndex] = true;
        }
        
        // 从可选列表中移除
        allAffixes.splice(randomIndex, 1);
    }
    
    // 更新显示
    displayAffixes();
}

// 更新侵蚀统计
function updateErosionStats() {
    document.getElementById('erosion-count').textContent = erosionStats.count;
    document.getElementById('dark-core-used').textContent = erosionStats.darkCoreUsed;
    document.getElementById('demon-core-used').textContent = erosionStats.demonCoreUsed;
    document.getElementById('total-erosion-cost').textContent = `${erosionStats.totalCost.toFixed(2)} 初火源质`;
    
    // 更新侵蚀结果统计
    updateResultStats();
}

// 新增：更新侵蚀结果统计显示
function updateResultStats() {
    document.getElementById('mutation-count').textContent = erosionStats.results.mutation;
    document.getElementById('chaos-count').textContent = erosionStats.results.chaos;
    document.getElementById('profane-count').textContent = erosionStats.results.profane;
    document.getElementById('pride-count').textContent = erosionStats.results.pride;
    document.getElementById('void-count').textContent = erosionStats.results.void;
}

// 显示侵蚀结果
function displayErosionResult(result, erosionType) {
    const resultArea = document.getElementById('erosion-result-area');
    const resultContent = document.getElementById('erosion-result-content');
    
    const erosionTypeName = erosionType === 'dark' ? '黑暗侵蚀' : '至暗侵蚀';
    resultContent.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>${erosionTypeName}</strong>
        </div>
        <div style="font-size: 24px; color: var(--primary-color);">
            ${result}
        </div>
    `;
    
    resultArea.style.display = 'block';
}

// 重置侵蚀计数
function resetErosionCount() {
    erosionStats = {
        count: 0,
        darkCoreUsed: 0,
        demonCoreUsed: 0,
        totalCost: 0,
        // 重置侵蚀结果统计
        results: {
            mutation: 0,
            chaos: 0,
            profane: 0,
            pride: 0,
            void: 0
        }
    };
    
    updateErosionStats();
    
    // 隐藏侵蚀结果
    document.getElementById('erosion-result-area').style.display = 'none';
    
    showNotification('侵蚀计数已重置', 'success');
}

// 新增：模拟次数调整功能
function adjustSimulationCount(delta) {
    const input = document.getElementById('simulation-count');
    let currentValue = parseInt(input.value) || 100;
    let newValue = currentValue + delta;
    
    // 确保是100的整数倍且不小于100
    newValue = Math.max(100, Math.round(newValue / 100) * 100);
    input.value = newValue;
}

// 新增：验证模拟次数输入
function validateSimulationCount(input) {
    let value = parseInt(input.value) || 100;
    // 确保是100的整数倍且不小于100
    value = Math.max(100, Math.round(value / 100) * 100);
    input.value = value;
}

// 新增：执行多次侵蚀模拟
function performMultipleErosion(erosionType) {
    const simulationCount = parseInt(document.getElementById('simulation-count').value) || 100;
    
    // 验证装备是否已选择
    if (!currentEquipment) {
        showNotification('请先选择装备', 'error');
        return;
    }
    
    // 获取价格
    const darkCorePrice = parseFloat(document.getElementById('dark-core-price').value) || 0;
    const demonCorePrice = parseFloat(document.getElementById('demon-core-price').value) || 0;
    
    if (darkCorePrice <= 0 || demonCorePrice <= 0) {
        showNotification('请输入有效的核心价格', 'error');
        return;
    }
    
    // 执行批量模拟
    for (let i = 0; i < simulationCount; i++) {
        const result = executeErosionLogicSimulation(erosionType);
        
        // 更新统计数据
        erosionStats.count++;
        
        if (erosionType === 'dark') {
            erosionStats.darkCoreUsed++;
            erosionStats.totalCost += darkCorePrice;
        } else {
            erosionStats.demonCoreUsed++;
            erosionStats.totalCost += demonCorePrice;
        }
        
        // 更新结果统计
        switch (result) {
            case '异化':
                erosionStats.results.mutation++;
                break;
            case '混沌':
                erosionStats.results.chaos++;
                break;
            case '亵渎':
                erosionStats.results.profane++;
                break;
            case '傲慢':
                erosionStats.results.pride++;
                break;
            case '虚无':
                erosionStats.results.void++;
                break;
        }
    }
    
    // 更新显示
    updateErosionStats();
    
    // 显示模拟结果
    const erosionTypeName = erosionType === 'dark' ? '黑暗侵蚀' : '至暗侵蚀';
    showNotification(`${erosionTypeName}模拟${simulationCount}次完成`, 'success');
}

// 新增：仅用于模拟的侵蚀逻辑（不修改装备状态）
function executeErosionLogicSimulation(erosionType) {
    const random = Math.random() * 100;
    
    if (erosionType === 'dark') {
        // 黑暗侵蚀概率
        if (random < 25) return '异化';
        if (random < 50) return '混沌';
        if (random < 65) return '亵渎';
        if (random < 95) return '傲慢';
        return '虚无';
    } else {
        // 至暗侵蚀概率
        if (random < 30) return '异化';
        if (random < 60) return '混沌';
        if (random < 75) return '亵渎';
        if (random < 90) return '傲慢';
        return '虚无';
    }
}

// 新增：设置侵蚀系统事件监听器
function setupErosionEventListeners() {
    // 模拟次数输入框事件
    const simulationCountInput = document.getElementById('simulation-count');
    if (simulationCountInput) {
        // 鼠标滚轮调整
        simulationCountInput.addEventListener('wheel', function(event) {
            handleWheelAdjust(event, this, 100);
        });
        
        // 输入验证
        simulationCountInput.addEventListener('blur', function() {
            validateSimulationCount(this);
        });
        
        // 回车键验证
        simulationCountInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                validateSimulationCount(this);
            }
        });
    }
    
    // 模拟次数调整按钮
    const decreaseBtn = document.getElementById('decrease-simulation');
    const increaseBtn = document.getElementById('increase-simulation');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            adjustSimulationCount(-100);
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            adjustSimulationCount(100);
        });
    }
    
    console.log('侵蚀系统事件监听器设置完成');
}

// 侵蚀模拟功能初始化已合并到主DOMContentLoaded事件中