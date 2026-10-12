// === CONFIGURACIÓN INICIAL Y ADICIÓN DE PRODUCTOS ===
const RESTAURANT_PHONE = "528110314475";
let cart = [];

// Carga inicial al iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    const savedCart = localStorage.getItem('restaurant_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }

    const savedName = localStorage.getItem('cust-name');
    const savedMethod = localStorage.getItem('delivery-method');
    const savedAddress = localStorage.getItem('cust-address');

    if (savedName) document.getElementById('cust-name').value = savedName;
    if (savedMethod) {
        const radio = document.querySelector(`input[name="delivery-method"][value="${savedMethod}"]`);
        if (radio) {
            radio.checked = true;
            toggleAddressField();
        }
    }
    if (savedAddress) document.getElementById('cust-address').value = savedAddress;

    // Listeners de los botones "Agregar"
    document.querySelectorAll('.btn-add').forEach(button => {
        button.addEventListener('click', addToCart);
    });

    // Guardado automático del formulario
    document.getElementById('cust-name').addEventListener('input', (e) => localStorage.setItem('cust-name', e.target.value.trim()));
    
    if (document.getElementById('cust-address')) {
        document.getElementById('cust-address').addEventListener('input', (e) => localStorage.setItem('cust-address', e.target.value.trim()));
    }

    document.querySelectorAll('input[name="delivery-method"]').forEach(radio => {
        radio.addEventListener('change', (e) => localStorage.setItem('delivery-method', e.target.value));
    });
});

function addToCart(e) {
    const card = e.target.closest('.product-card');
    const baseId = card.dataset.id;
    const baseName = card.dataset.name;
    const basePrice = parseFloat(card.dataset.price) || 0;
    const checkedVariants = card.querySelectorAll('.variant-checkbox:checked');

    if (checkedVariants.length === 0) {
        alert("Por favor, selecciona al menos una opción de la lista antes de agregar.");
        return;
    }

    checkedVariants.forEach(checkbox => {
        const variantName = checkbox.value;
        const extraPrice = parseFloat(checkbox.dataset.extra) || 0;
        const finalPrice = basePrice + extraPrice;
        const uniqueId = `${baseId}-${variantName}`;
        const fullName = `${baseName}: ${variantName}`;

        const existingItem = cart.find(item => item.id === uniqueId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: uniqueId, name: fullName, price: finalPrice, quantity: 1 });
        }
    });

    // Desmarcar checkboxes después de agregar
    checkedVariants.forEach(checkbox => checkbox.checked = false);
    updateCartUI();
}
// === INTERFAZ DEL CARRITO DE COMPRAS ===
function changeQuantity(id, amount) {
    const item = cart.find(item => item.id === id);
    if (!item) return;

    item.quantity += amount;
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== id);
    }
    updateCartUI();
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const totalAmountContainer = document.getElementById('total-amount');
    const btnWhatsapp = document.getElementById('btn-whatsapp');

    if (!cartItemsContainer || !totalAmountContainer || !btnWhatsapp) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-message">El carrito está vacío</p>';
        btnWhatsapp.disabled = true;
    } else {
        btnWhatsapp.disabled = false;
        cart.forEach(item => {
            const itemCost = item.price * item.quantity;
            total += itemCost;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <span>${item.name} ($${itemCost.toFixed(2)})</span>
                <div class="cart-controls">
                    <button class="btn-qty-minus" onclick="changeQuantity('${item.id}', -1)">-</button>
                    <span class="item-qty">${item.quantity}</span>
                    <button class="btn-qty-plus" onclick="changeQuantity('${item.id}', 1)">+</button>
                </div>`;
            cartItemsContainer.appendChild(div);
        });
    }

    totalAmountContainer.textContent = `$${total.toFixed(2)}`;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.textContent = totalItems;

    // Desplegar automáticamente al agregar el primer producto
    if (cart.length === 1 && totalItems === 1) {
        const cartBody = document.getElementById('cart-body');
        if (cartBody) cartBody.classList.add('open');
    }

    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
}

function toggleCart() {
    const cartBody = document.getElementById('cart-body');
    const toggleIcon = document.getElementById('cart-toggle-icon');
    if (!cartBody || !toggleIcon) return;

    cartBody.classList.toggle('open');
    toggleIcon.textContent = cartBody.classList.contains('open') ? '▲' : '▼';
}
// === PROCESAMIENTO DE PEDIDOS Y MODAL DE ENVÍO ===
function toggleAddressField() {
    const checkedMethod = document.querySelector('input[name="delivery-method"]:checked');
    const addressInput = document.getElementById('cust-address');
    if (!checkedMethod || !addressInput) return;

    if (checkedMethod.value === 'Domicilio') {
        addressInput.classList.remove('hidden-field');
        addressInput.required = true;
    } else {
        addressInput.classList.add('hidden-field');
        addressInput.value = '';
        addressInput.required = false;
    }
}

function togglePaymentFields() {
    const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
    const deliveryRadio = document.querySelector('input[name="delivery-method"]:checked');
    const cashField = document.getElementById('cash-field');
    const transferField = document.getElementById('transfer-field');
    
    if (!paymentRadio || !cashField || !transferField) return;

    // Si elige Efectivo Y el método de entrega es Domicilio, se muestra la pregunta del cambio
    if (paymentRadio.value === 'Efectivo' && deliveryRadio && deliveryRadio.value === 'Domicilio') {
        cashField.classList.remove('hidden-field');
        transferField.classList.add('hidden-field');
    } 
    // Si elige Transferencia, muestra los datos de la cuenta
    else if (paymentRadio.value === 'Transferencia') {
        cashField.classList.add('hidden-field');
        transferField.classList.remove('hidden-field');
    } 
    // Si elige Efectivo pero va a Recoger en tienda, no mostramos ninguno de los dos campos
    else {
        cashField.classList.add('hidden-field');
        transferField.classList.add('hidden-field');
    }
}


// Vincula el botón principal del formulario al despliegue del modal del ticket
document.addEventListener('DOMContentLoaded', () => {
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', sendOrder);
    }
});

function sendOrder() {
    if (cart.length === 0) return;

    const name = document.getElementById('cust-name').value.trim();
    const checkedMethod = document.querySelector('input[name="delivery-method"]:checked');
    const address = document.getElementById('cust-address').value.trim();

    if (!name) {
        alert("Por favor, ingresa tu nombre antes de revisar el pedido.");
        document.getElementById('cust-name').focus();
        return;
    }

    if (checkedMethod && checkedMethod.value === 'Domicilio' && !address) {
        alert("Por favor, ingresa la dirección de entrega.");
        document.getElementById('cust-address').focus();
        return;
    }

    const method = checkedMethod ? checkedMethod.value : 'Recoger';
    const ticketDetails = document.getElementById('ticket-details');
    if (!ticketDetails) return;

    let ticketHTML = '<div class="ticket-container">';
    ticketHTML += `<strong>CLIENTE:</strong> ${name}<br>`;
    ticketHTML += `<strong>ENTREGA:</strong> ${method}<br>`;
    if (method === 'Domicilio') ticketHTML += `<strong>DIRECCIÓN:</strong> ${address}<br>`;
    ticketHTML += '<div class="ticket-line"></div>';

    let total = 0;
    const orderLines = cart.map(item => {
        const itemCost = item.price * item.quantity;
        total += itemCost;
        ticketHTML += `<div class="ticket-row"><span>${item.quantity} x ${item.name}</span><span>$${itemCost.toFixed(2)}</span></div>`;
        return `${item.quantity} x ${item.name}`;
    });

    ticketHTML += `<div class="ticket-line"></div><div class="ticket-row" style="font-weight:bold; font-size:1.05rem;"><span>TOTAL:</span><span>$${total.toFixed(2)}</span></div></div>`;
    ticketDetails.innerHTML = ticketHTML;

    const defaultRadio = document.querySelector('input[name="payment-method"][value="Efectivo"]');
    if (defaultRadio) defaultRadio.checked = true;
    if (document.getElementById('cash-amount')) document.getElementById('cash-amount').value = "";
    togglePaymentFields();

     const modal = document.getElementById('ticket-modal');
    if (modal) {
        modal.dataset.total = total;
        modal.dataset.itemsText = orderLines.join(', ');
        modal.dataset.name = name;
        modal.dataset.method = method;
        modal.dataset.address = address;
        modal.classList.add('show');
    }

    // Escuchar cambios en los botones de pago mientras la ventana está abierta
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', togglePaymentFields);
    });
}

function closeTicketModal() {
    const modal = document.getElementById('ticket-modal');
    if (modal) modal.classList.remove('show');
}

function confirmAndSendWhatsApp() {
    const modal = document.getElementById('ticket-modal');
    if (!modal) return;

    const modalData = modal.dataset;
    const total = parseFloat(modalData.total);
    const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentRadio ? paymentRadio.value : 'Efectivo';

    let message = `*NUEVO PEDIDO*\n\n*Cliente:* ${modalData.name}\n*Método:* ${modalData.method}\n`;
    if (modalData.method === 'Domicilio') message += `*Dirección:* ${modalData.address}\n`;
    
    message += `\n*Productos:* ${modalData.itemsText}\n*Total a pagar:* $${total.toFixed(2)}\n*Forma de pago:* ${paymentMethod}\n`;

    // La validación del cambio en efectivo SOLO aplica si es a Domicilio
    if (paymentMethod === 'Efectivo' && modalData.method === 'Domicilio') {
        const cashAmountInput = document.getElementById('cash-amount').value.trim();
        if (!cashAmountInput || parseFloat(cashAmountInput) < total) {
            alert("Por favor indica una cantidad válida con la que vas a pagar.");
            document.getElementById('cash-amount').focus();
            return;
        }
        const cashAmount = parseFloat(cashAmountInput);
        message += `*Paga con:* $${cashAmount.toFixed(2)}\n*Cambio requerido:* $${(cashAmount - total).toFixed(2)}\n`;
    } 
    // Si es en efectivo pero pasa a Recoger
    else if (paymentMethod === 'Efectivo' && modalData.method === 'Recoger') {
        message += `*Nota:* Pago en efectivo al recoger en tienda.\n`;
    } 
    // Si es transferencia
    else {
        message += `\n*Nota:* (Enviaré la captura de mi transferencia justo debajo de este mensaje)\n`;
    }

    localStorage.clear();
    const globalPendingMessage = encodeURIComponent(message);
    window.open(`https://wa.me/528110314475/?text=${globalPendingMessage}`, '_blank');
    closeTicketModal();
    setTimeout(() => { location.reload(); }, 500);
}

