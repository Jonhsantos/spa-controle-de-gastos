// Selecionar elementos
const btnAddIncomes = document.querySelector('.btn-add-incomes');
const btnAddExpenses = document.querySelector('.btn-add-expenses');
const formSection = document.querySelector('.form-section');
const nightModeToggle = document.querySelector('.night-mode-toggle');
const nightModeIcon = document.querySelector('.night-mode-toggle .material-symbols-outlined');
const incomeCategoryGroup = document.getElementById('incomeCategoryGroup');
const expenseCategoryGroup = document.getElementById('expenseCategoryGroup');
const otherCategoryGroup = document.getElementById('otherCategoryGroup');
const incomeCategory = document.getElementById('incomeCategory');
const expenseCategory = document.getElementById('expenseCategory');
const btnCloseForm = document.getElementById('btnCloseForm');
const btnSave = document.getElementById('btnSave');
const itemsList = document.querySelector('.items-list');
const cardIncomes = document.querySelector('.card-incomes .card-value');
const cardExpenses = document.querySelector('.card-expenses .card-value');
const cardBalance = document.querySelector('.card-balance .card-value');

// array para armazenar os itens
let items = [];
let currentType = null; // 'income' ou 'expense'

// Mostrar formulário ao clicar no botão de entradas
btnAddIncomes.addEventListener('click', function() {
    formSection.classList.add('visible');
    incomeCategoryGroup.style.display = 'block';
    expenseCategoryGroup.style.display = 'none';
    otherCategoryGroup.style.display = 'none';
    currentType = 'income';
});

// Mostrar formulário ao clicar no botão de despesas
btnAddExpenses.addEventListener('click', function() {
    formSection.classList.add('visible');
    incomeCategoryGroup.style.display = 'none';
    expenseCategoryGroup.style.display = 'block';
    otherCategoryGroup.style.display = 'none';
    currentType = 'expense';
});

// Mostrar campo "Outra categoria" quando selecionar "Outros" em entradas
incomeCategory.addEventListener('change', function() {
    if (this.value === 'outro') {
        otherCategoryGroup.style.display = 'block';
    } else {
        otherCategoryGroup.style.display = 'none';
    }
});

// Mostrar campo "Outra categoria" quando selecionar "Outro" em despesas
expenseCategory.addEventListener('change', function() {
    if (this.value === 'outro') {
        otherCategoryGroup.style.display = 'block';
    } else {
        otherCategoryGroup.style.display = 'none';
    }
});

// Fechar formulário ao clicar no botão X
btnCloseForm.addEventListener('click', function() {
    formSection.classList.remove('visible');
    currentType = null;
});

// Adicionar item
function addItem() {
    const itemName = document.getElementById('itemName').value.trim();
    const amount = document.getElementById('amount').value;
    
    if (itemName === '' || amount === '') {
        alert('Por favor, preencha o nome e o valor!');
        return;
    }
    
    let category = '';
    
    if (currentType === 'income') {
        category = incomeCategory.value;
        if (category === 'outro') {
            category = document.getElementById('otherCategory').value.trim() || 'Outros';
        }
    } else {
        category = expenseCategory.value;
        if (category === 'outro') {
            category = document.getElementById('otherCategory').value.trim() || 'Outro';
        }
    }
    
    const item = {
        id: Date.now(),
        name: itemName,
        category: category,
        amount: parseFloat(amount),
        type: currentType
    };
    
    items.push(item);
    
    // Limpar formulário
    document.getElementById('itemName').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('otherCategory').value = '';
    otherCategoryGroup.style.display = 'none';
    
    // Resetar selects
    incomeCategory.value = 'salario';
    expenseCategory.value = 'contas';
    
    // Esconder formulário
    formSection.classList.remove('visible');
    currentType = null;
    
    renderItems();
    updateSummary();
}

btnSave.addEventListener('click', addItem);

// Renderizar itens
function renderItems() {
    // Remover itens estáticos do HTML
    const staticItems = itemsList.querySelectorAll('.item');
    staticItems.forEach(item => item.remove());
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('item');
        div.classList.add(item.type === 'income' ? 'item-income' : 'item-expense');
        
        div.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span class="item-tag ${item.type === 'income' ? 'tag-income' : 'tag-expense'}">#${item.category}</span>
            <span class="item-amount">R$ ${item.amount.toFixed(2).replace('.', ',')}</span>
            <div class="item-actions">
                <button class="btn-action btn-edit" title="Editar">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn-action btn-delete" title="Excluir">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;
        
        // Botão de excluir
        const btnDelete = div.querySelector('.btn-delete');
        btnDelete.addEventListener('click', () => {
            items = items.filter(i => i.id !== item.id);
            renderItems();
            updateSummary();
        });
        
        // Botão de editar
        const btnEdit = div.querySelector('.btn-edit');
        btnEdit.addEventListener('click', () => {
            editItem(item);
        });
        
        itemsList.appendChild(div);
    });
}

// Editar item
function editItem(item) {
    // Mostrar formulário
    formSection.classList.add('visible');
    
    // Preencher campos
    document.getElementById('itemName').value = item.name;
    document.getElementById('amount').value = item.amount;
    
    if (item.type === 'income') {
        incomeCategoryGroup.style.display = 'block';
        expenseCategoryGroup.style.display = 'none';
        currentType = 'income';
        
        // Verificar se a categoria existe no select
        let categoryExists = false;
        for (let option of incomeCategory.options) {
            if (option.value === item.category) {
                categoryExists = true;
                break;
            }
        }
        
        if (categoryExists) {
            incomeCategory.value = item.category;
            otherCategoryGroup.style.display = 'none';
        } else {
            incomeCategory.value = 'outro';
            document.getElementById('otherCategory').value = item.category;
            otherCategoryGroup.style.display = 'block';
        }
    } else {
        incomeCategoryGroup.style.display = 'none';
        expenseCategoryGroup.style.display = 'block';
        currentType = 'expense';
        
        // Verificar se a categoria existe no select
        let categoryExists = false;
        for (let option of expenseCategory.options) {
            if (option.value === item.category) {
                categoryExists = true;
                break;
            }
        }
        
        if (categoryExists) {
            expenseCategory.value = item.category;
            otherCategoryGroup.style.display = 'none';
        } else {
            expenseCategory.value = 'outro';
            document.getElementById('otherCategory').value = item.category;
            otherCategoryGroup.style.display = 'block';
        }
    }
    
    // Remover item original
    items = items.filter(i => i.id !== item.id);
    renderItems();
    updateSummary();
}

// Atualizar resumo
function updateSummary() {
    const totalIncomes = items
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + item.amount, 0);
    
    const totalExpenses = items
        .filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + item.amount, 0);
    
    const balance = totalIncomes - totalExpenses;
    
    cardIncomes.textContent = `R$ ${totalIncomes.toFixed(2).replace('.', ',')}`;
    cardExpenses.textContent = `R$ ${totalExpenses.toFixed(2).replace('.', ',')}`;
    cardBalance.textContent = `R$ ${balance.toFixed(2).replace('.', ',')}`;
}

// Alternar modo noturno
nightModeToggle.addEventListener('click', function() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        html.removeAttribute('data-theme');
        nightModeIcon.textContent = 'brightness_4';
    } else {
        html.setAttribute('data-theme', 'dark');
        nightModeIcon.textContent = 'light_mode';
    }
});