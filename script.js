// 全局变量
let currentTab = 'crafting';

// 收割档位数据（由收割.txt动态加载）
let harvestTierData = { tiers: [] };

// 解析收割.txt文本为档位数据
function parseHarvestDataText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const tiers = [];
    let current = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('档位：')) {
            if (current) tiers.push(current);
            const tierNum = parseInt(line.replace('档位：', '').trim(), 10);
            current = { tier: tierNum, harvestsCount: null, interval: null, cooldownNoPet: null, cooldownPet1: null, cooldownPet6: null };
        } else if (line.startsWith('收割次数：') && current) {
            const val = parseFloat(line.replace('收割次数：', '').trim());
            current.harvestsCount = isNaN(val) ? null : val;
        } else if (line.startsWith('触发间隔：') && current) {
            const val = parseFloat(line.replace('触发间隔：', '').trim());
            current.interval = isNaN(val) ? null : val;
        } else if (line.includes('无宠物：') && current) {
            const num = line.split('无宠物：')[1]?.replace('%', '').trim();
            const val = parseFloat(num);
            current.cooldownNoPet = isNaN(val) ? null : val;
        } else if (line.includes('1级宠物：') && current) {
            const num = line.split('1级宠物：')[1]?.replace('%', '').trim();
            const val = parseFloat(num);
            current.cooldownPet1 = isNaN(val) ? null : val;
        } else if (line.includes('6级宠物：') && current) {
            const num = line.split('6级宠物：')[1]?.replace('%', '').trim();
            const val = parseFloat(num);
            current.cooldownPet6 = isNaN(val) ? null : val;
        }
    }
    if (current) tiers.push(current);

    // 过滤不完整条目并按冷却（无宠物）从高到低排序
    return tiers.filter(t => t.tier != null && t.cooldownNoPet != null)
                .sort((a, b) => b.cooldownNoPet - a.cooldownNoPet);
}

// 从文件加载收割档位数据
async function loadHarvestTierDataFromFile() {
    try {
        const resp = await fetch('收割.txt');
        const text = await resp.text();
        harvestTierData.tiers = parseHarvestDataText(text);
    } catch (e) {
        console.error('加载收割档位数据失败:', e);
        harvestTierData.tiers = [];
    }
}

// 计算收割档位
function calculateHarvestTier() {
    const cooldownInput = document.getElementById('current-harvest-cooldown');
    if (!cooldownInput || !harvestTierData.tiers.length) return;

    const currentCooldown = parseFloat(cooldownInput.value) || 0;
    let currentTier = null;
    let nextTier = null;

    // 档位数据按无宠物冷却从高到低排列
    for (let i = 0; i < harvestTierData.tiers.length; i++) {
        const tier = harvestTierData.tiers[i];
        if (currentCooldown >= tier.cooldownNoPet) {
            currentTier = tier;
            // 下一档位为更高要求的上一项（高到低）
            nextTier = i > 0 ? harvestTierData.tiers[i - 1] : null;
            break;
        }
    }

    // 若低于最低档位阈值，则当前为最低档位
    if (!currentTier) {
        currentTier = harvestTierData.tiers[harvestTierData.tiers.length - 1];
        nextTier = harvestTierData.tiers.length > 1 ? harvestTierData.tiers[harvestTierData.tiers.length - 2] : null;
    }

    updateHarvestTierDisplay(currentTier, nextTier, currentCooldown);
}

// 更新收割档位显示
function updateHarvestTierDisplay(currentTier, nextTier, currentCooldown) {
    // 兼容无参数调用
    if (!harvestTierData.tiers.length || currentTier == null || nextTier === undefined || currentCooldown == null) {
        const cooldownInput = document.getElementById('current-harvest-cooldown');
        currentCooldown = parseFloat(cooldownInput?.value) || 0;

        let cur = null;
        let nxt = null;
        for (let i = 0; i < harvestTierData.tiers.length; i++) {
            const t = harvestTierData.tiers[i];
            if (currentCooldown >= t.cooldownNoPet) {
                cur = t;
                nxt = i > 0 ? harvestTierData.tiers[i - 1] : null;
                break;
            }
        }
        if (!cur && harvestTierData.tiers.length) {
            cur = harvestTierData.tiers[harvestTierData.tiers.length - 1];
            nxt = harvestTierData.tiers.length > 1 ? harvestTierData.tiers[harvestTierData.tiers.length - 2] : null;
        }
        currentTier = cur;
        nextTier = nxt;
    }

    const currentTierDetails = document.getElementById('current-tier-details');
    const nextTierDetails = document.getElementById('next-tier-details');

    if (currentTierDetails && currentTier) {
        const count = currentTier.harvestsCount;
        const interval = currentTier.interval;
        currentTierDetails.innerHTML = `
            <div><strong>当前档位 ${currentTier.tier}</strong></div>
            <div>收割次数: ${count != null ? Number(count).toFixed(2) : '-'}</div>
            <div>收割间隔: ${interval != null ? Number(interval).toFixed(3) : '-'}秒</div>
        `;
    }

    if (nextTierDetails) {
        if (nextTier) {
            nextTierDetails.innerHTML = `
                <div><strong>下一档位 ${nextTier.tier} 所需收割冷却</strong></div>
                <div>无宠物：${Number(nextTier.cooldownNoPet).toFixed(2)}%</div>
                <div>1级宠物：${Number(nextTier.cooldownPet1).toFixed(2)}%</div>
                <div>6级宠物：${Number(nextTier.cooldownPet6).toFixed(2)}%</div>
            `;
        } else {
            nextTierDetails.innerHTML = '<strong>已达到最高档位</strong>';
        }
    }
}

// 打造系统模块切换
function showCraftingModule(moduleId) {
    const modules = document.querySelectorAll('.crafting-module');
    const buttons = document.querySelectorAll('.function-btn');

    modules.forEach(m => { m.style.display = 'none'; });
    buttons.forEach(b => b.classList.remove('active'));

    const target = document.getElementById(moduleId);
    if (target) { target.style.display = 'block'; }
    const targetButton = Array.from(buttons).find(btn => btn.getAttribute('onclick')?.includes(moduleId));
    if (targetButton) { targetButton.classList.add('active'); }
}

// 伤害系统模块切换
function showDamageModule(moduleId) {
    const modules = document.querySelectorAll('#damage .damage-module');
    const buttons = document.querySelectorAll('#damage .function-btn');

    modules.forEach(m => { m.style.display = 'none'; });
    buttons.forEach(b => b.classList.remove('active'));

    const target = document.getElementById(moduleId);
    if (target) { target.style.display = 'block'; }
    const targetButton = Array.from(buttons).find(btn => btn.getAttribute('onclick')?.includes(moduleId));
    if (targetButton) { targetButton.classList.add('active'); }
}

// 物理/元素伤害输入切换
function switchDamageType(type) {
    const physicalInputs = document.getElementById('physical-damage-inputs');
    const elementalInputs = document.getElementById('elemental-damage-inputs');
    const physicalBtn = document.getElementById('physical-toggle');
    const elementalBtn = document.getElementById('elemental-toggle');

    if (!physicalInputs || !elementalInputs || !physicalBtn || !elementalBtn) return;

    if (type === 'physical') {
        physicalInputs.style.display = 'block';
        elementalInputs.style.display = 'none';
        physicalBtn.classList.add('active');
        elementalBtn.classList.remove('active');
    } else {
        physicalInputs.style.display = 'none';
        elementalInputs.style.display = 'block';
        elementalBtn.classList.add('active');
        physicalBtn.classList.remove('active');
    }
}

// 初始化收割档位系统
async function initializeHarvestTierSystem() {
    const cooldownInput = document.getElementById('current-harvest-cooldown');
    if (!cooldownInput) return;

    await loadHarvestTierDataFromFile();

    // 初始化表格
    initializeHarvestTierTable();

    // 添加事件监听器
    cooldownInput.addEventListener('input', calculateHarvestTier);
    cooldownInput.addEventListener('wheel', function(event) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -1 : 1;
        const currentValue = parseFloat(this.value) || 0;
        this.value = Math.max(0, currentValue + delta);
        calculateHarvestTier();
    });

    // 初始计算
    calculateHarvestTier();
}

// 初始化收割档位表格
function initializeHarvestTierTable() {
    const tableBody = document.querySelector('#harvest-tier-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // 档位按编号升序展示
    const sortedTiers = [...harvestTierData.tiers].sort((a, b) => a.tier - b.tier);

    sortedTiers.forEach(tier => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tier.tier}</td>
            <td>${tier.harvestsCount != null ? Number(tier.harvestsCount).toFixed(2) : '-'}</td>
            <td>${tier.interval != null ? Number(tier.interval).toFixed(3) : '-'}秒</td>
            <td>${tier.cooldownNoPet != null ? Number(tier.cooldownNoPet).toFixed(2) : '-'}%</td>
            <td>${tier.cooldownPet1 != null ? Number(tier.cooldownPet1).toFixed(2) : '-'}%</td>
            <td>${tier.cooldownPet6 != null ? Number(tier.cooldownPet6).toFixed(2) : '-'}%</td>
        `;
        tableBody.appendChild(row);
    });
}

// 梦境装备数据
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

// 设置标签页导航
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            
            // 更新当前标签页
            currentTab = tabId;

            // 移除所有活动状态
            navItems.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // 添加活动状态到当前标签页
            item.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // 保存当前标签页到本地存储
            localStorage.setItem('currentTab', tabId);
        });
    });

    // 恢复上次选择的标签页
    const savedTab = localStorage.getItem('currentTab');
    if (savedTab) {
        const savedButton = document.querySelector(`[data-tab="${savedTab}"]`);
        if (savedButton) {
            savedButton.click();
        }
    } else {
        // 默认显示第一个标签页
        const firstButton = document.querySelector('.nav-item');
        if (firstButton) {
            firstButton.click();
        }
    }
}

// 设置表单验证
function setupFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
}

// 设置动画效果
function setupAnimations() {
    // 添加淡入效果
    document.querySelectorAll('.fade-in').forEach(element => {
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.5s ease-in-out';
        setTimeout(() => {
            element.style.opacity = '1';
        }, 100);
    });

    // 添加滑入效果
    document.querySelectorAll('.slide-in').forEach(element => {
        element.style.transform = 'translateX(-100%)';
        element.style.transition = 'transform 0.5s ease-in-out';
        setTimeout(() => {
            element.style.transform = 'translateX(0)';
        }, 100);
    });
}

// 修复图片路径
function fixImagePaths() {
    document.querySelectorAll('img[data-src]').forEach(img => {
        const originalSrc = img.getAttribute('data-src');
        if (originalSrc) {
            img.src = originalSrc.startsWith('/') ? originalSrc : '/' + originalSrc;
        }
    });
}

// 初始化梦境系统
function initializeDreamSystem() {
    // 这里添加梦境系统的初始化逻辑
    console.log('梦境系统初始化');
}

// 初始化技能系统
function initializeSkillSystem() {
    // 这里添加技能系统的初始化逻辑
    console.log('技能系统初始化');
}

// 初始化封印系统
function initializeSealSystem() {
    // 设置封印系统光环标签页切换
    setupSealHaloTabs();
    console.log('封印系统初始化');
}

// 设置封印系统光环标签页
function setupSealHaloTabs() {
    const tabs = document.querySelectorAll('.seal-halo-tab');
    const panels = document.querySelectorAll('.seal-halo-panel');
    if (!tabs.length || !panels.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const haloNumber = tab.getAttribute('data-halo');
            // 切换激活状态
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const panel = document.getElementById(`seal-halo-${haloNumber}`);
            if (panel) panel.classList.add('active');
        });
    });
}

// 初始化高塔系统
function initializeTowerSystem() {
    // 这里添加高塔系统的初始化逻辑
    console.log('高塔系统初始化');
}

// 初始化侵蚀模拟
function initializeErosionSimulation() {
    // 这里添加侵蚀模拟的初始化逻辑
    console.log('侵蚀模拟初始化');
}

// 设置侵蚀事件监听器
function setupErosionEventListeners() {
    // 这里添加侵蚀相关的事件监听器
    console.log('侵蚀事件监听器设置完成');
}

// 设置打造事件监听器
function setupCraftingEventListeners() {
    // 这里添加打造相关的事件监听器
    console.log('打造事件监听器设置完成');
}

// 数据持久化系统
const DataPersistence = {
    // 保存数据到本地存储
    saveData: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },

    // 从本地存储加载数据
    loadData: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('加载数据失败:', error);
            return null;
        }
    },

    // 加载所有数据
    loadAllData: async function() {
        // 加载收割档位数据
        const harvestData = this.loadData('harvestData');
        if (harvestData) {
            const cooldownInput = document.getElementById('current-harvest-cooldown');
            if (cooldownInput) {
                cooldownInput.value = harvestData.cooldown || 0;
                calculateHarvestTier();
            }
        }

        // 加载当前标签页
        const savedTab = localStorage.getItem('currentTab');
        if (savedTab) {
            const tabButton = document.querySelector(`[data-tab="${savedTab}"]`);
            if (tabButton) {
                tabButton.click();
            }
        }

        return true;
    },

    // 保存所有数据
    saveAllData: function() {
        // 保存收割档位数据
        const cooldownInput = document.getElementById('current-harvest-cooldown');
        if (cooldownInput) {
            this.saveData('harvestData', {
                cooldown: cooldownInput.value
            });
        }

        // 保存当前标签页
        if (currentTab) {
            localStorage.setItem('currentTab', currentTab);
        }
    }
};

// 设置自动保存
function setupAutoSave() {
    // 每30秒自动保存一次
    setInterval(() => {
        DataPersistence.saveAllData();
        console.log('数据已自动保存');
    }, 30000);

    // 页面关闭前保存
    window.addEventListener('beforeunload', () => {
        DataPersistence.saveAllData();
    });
}

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
    setupThemeToggle();
    initializeHarvestTierSystem();
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

// 深色模式开关
function setupThemeToggle() {
    const checkbox = document.getElementById('theme-switch');
    if (!checkbox) return;

    const body = document.body;
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    };

    // 读取持久化主题
    const saved = localStorage.getItem('theme');
    if (saved) {
        applyTheme(saved);
        checkbox.checked = saved === 'dark';
    }

    // 监听切换
    checkbox.addEventListener('change', () => {
        const theme = checkbox.checked ? 'dark' : 'light';
        applyTheme(theme);
        localStorage.setItem('theme', theme);
    });
}