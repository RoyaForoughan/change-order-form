document.addEventListener('DOMContentLoaded', function() {
    const costTypeRadios = document.querySelectorAll('input[name="costType"]');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.querySelector('.close');
    const submitButton = document.getElementById('submitButton');
    let lineItemCounter = 0;
    const maxLineItems = 5;
    let alertModal;

    costTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            adjustModalWidth(this.value);
            if (this.value === 'flatFee') {
                fetchHTMLContent('flatFee.html').then(content => {
                    showModal('Flat Fee Details', content);
                });
            } else if (this.value === 'lineItem') {
                fetchHTMLContent('lineItem.html').then(content => {
                    showModal('Line Item Details', content);
                    document.getElementById('addLineItemButton').addEventListener('click', addLineItem);
                    addLineItem();
                    calculateSum();
                });
            }
        });
    });

    function clearRadioButtons() {
        costTypeRadios.forEach(radio => {
            radio.checked = false;
        });
    }

    closeModal.addEventListener('click', function() {
        closeModalAnimation();
    });

    submitButton.addEventListener('click', function(event) {
        event.preventDefault(); 
        if (validateForm()) {
            closeModalAnimation();
            showAlert('Data submitted', true);
        } else {
            showAlert('Please fill out all required fields correctly', false);
        }
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModalAnimation();
        }
    });

    function fetchHTMLContent(url) {
        return fetch(url)
            .then(response => {
                return response.text();
            })
            .catch(error => {
                throw error; 
            });
    }

    function showModal(title, content) {
        modalContent.innerHTML = `
            <h3 class="modal-title">${title}</h3>
            ${content}
        `;
        modal.style.display = 'flex';
        modal.classList.add('open');
        document.body.classList.add('modal-open');
        addInputEventListeners();
    }

    function closeModalAnimation() {
        modal.classList.remove('open');
        clearRadioButtons();
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            clearLineItems();
        }, 500);
    }

    function clearLineItems() {
        const lineItemsContainer = document.getElementById('lineItemsContainer');
        if (lineItemsContainer) {
            lineItemsContainer.innerHTML = '';
        }
        lineItemCounter = 0;
    }

    function addLineItem() {
        if (lineItemCounter >= maxLineItems) {
            showAlert('Maximum number of line items reached', false);
            return;
        }

        const lineItemsContainer = document.getElementById('lineItemsContainer');
        fetchHTMLContent('addLineItem.html').then(content => {
            const lineItem = document.createElement('div');
            lineItem.classList.add('line-item-container');
            lineItem.innerHTML = content;

            lineItemsContainer.appendChild(lineItem);
            lineItemCounter++;

            adjustLineItemWidth();
            addInputEventListeners();

            lineItem.querySelector('.quantity').addEventListener('input', calculateLineItem);
            lineItem.querySelector('.unit-cost').addEventListener('input', calculateLineItem);
            lineItem.querySelector('.implementation-cost-type').addEventListener('change', calculateLineItem);
            lineItem.querySelector('.implementation-cost').addEventListener('input', calculateLineItem);
            lineItem.querySelector('.removeLineItemButton').addEventListener('click', function() {
                lineItem.remove();
                lineItemCounter--;
                adjustLineItemWidth();
                calculateSum();
            });
        });
    }

    function addInputEventListeners() {
        const inputs = modal.querySelectorAll('input[type="text"], input[type="number"], select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                input.classList.remove('error'); 
                const errorMessage = input.nextElementSibling;
                if (errorMessage && errorMessage.classList.contains('error-message')) {
                    errorMessage.textContent = ''; 
                }
            });
        });
    }

    function adjustLineItemWidth() {
        const lineItems = document.querySelectorAll('.line-item-container');
        lineItems.forEach(item => {
            item.classList.remove('half-width', 'adjusted-width');
        });

        if (lineItems.length === 1) {
            lineItems.forEach(item => item.classList.remove('half-width', 'adjusted-width'));
        } else if (lineItems.length === 2) {
            lineItems.forEach(item => item.classList.add('half-width'));
        } else {
            lineItems.forEach(item => item.classList.add('adjusted-width'));
        }

        adjustElementWidth(); 
    }

    function validateForm() {
        let isValid = true;
        const inputs = modal.querySelectorAll('input[type="text"], input[type="number"], select, textarea');
        
        inputs.forEach(input => {
            input.classList.remove('error'); 
    
            let errorMessage = input.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                input.insertAdjacentElement('afterend', errorMessage);
            }
    
            
            if (input.readOnly) {
                return;
            }
    
            if (input.type === 'date') {
                if (!input.value || !isValidDate(input.value)) {
                    isValid = false;
                    input.classList.add('error');
                    errorMessage.textContent = 'Invalid date';
                }
            } else if (input.type === 'text' || input.tagName === 'TEXTAREA') {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('error');
                    errorMessage.textContent = 'This field is required';
                }
            } else if (input.type === 'number') {
                if (!input.value || !isValidNumber(input.value)) {
                    isValid = false;
                    input.classList.add('error');
                    errorMessage.textContent = 'Invalid number';
                }
            }
        });
    
        return isValid;
    }

    function isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    function isValidNumber(value) {
        const numericRegex = /^\d+(\.\d{1,2})?$/; 
        return numericRegex.test(value);
    }

    function adjustModalWidth(value) {
        if (value === 'flatFee') {
            modalContent.style.width = '800px';
        } else if (value === 'lineItem') {
            modalContent.style.width = '1000px';
        }
    }

    function calculateLineItem(event) {
        const lineItem = event.target.closest('.line-item-container');
        const quantity = parseFloat(lineItem.querySelector('.quantity').value) || 0;
        const unitCost = parseFloat(lineItem.querySelector('.unit-cost').value) || 0;
        const implementationCostType = lineItem.querySelector('.implementation-cost-type').value;
        const implementationCost = parseFloat(lineItem.querySelector('.implementation-cost').value) || 0;

        let builderCost = quantity * unitCost;
        let clientCost = builderCost;

        if (implementationCostType === '%') {
            clientCost += builderCost * (implementationCost / 100);
        } else {
            clientCost += implementationCost;
        }

        lineItem.querySelector('.builder-cost').value = builderCost.toFixed(2);
        lineItem.querySelector('.client-cost').value = clientCost.toFixed(2);

        calculateSum();
    }

    function calculateSum() {
        const lineItems = document.querySelectorAll('.line-item-container');
        let totalBuilderCost = 0;
        let totalClientCost = 0;

        lineItems.forEach(item => {
            totalBuilderCost += parseFloat(item.querySelector('.builder-cost').value) || 0;
            totalClientCost += parseFloat(item.querySelector('.client-cost').value) || 0;
        });

        document.getElementById('sumBuilderCost').textContent = totalBuilderCost.toFixed(2);
        document.getElementById('sumClientCost').textContent = totalClientCost.toFixed(2);
    }

    function showAlert(message, isSuccess) {
        const alertModal = document.getElementById('customAlertModal');
        const alertMessage = document.getElementById('alertMessage');
        const okButton = document.getElementById('okButton');

        modalContent.classList.remove('success', 'error');

        if (isSuccess) {
            alertModal.classList.add('success');
            okButton.classList.add('success');
        } else {
            alertModal.classList.add('error');
            okButton.classList.add('error');
        }

        alertMessage.textContent = message;
        alertModal.style.display = 'flex';

        setTimeout(function() {
            alertModal.style.opacity = '0';
            alertModal.style.pointerEvents = 'none';
            setTimeout(function() {
                alertModal.style.display = 'none';
                alertModal.style.opacity = '';
                alertModal.style.pointerEvents = '';
                alertModal.classList.remove('success', 'error');
                okButton.classList.remove('success', 'error');
            }, 500); 
        }, 2000); 
    }

    document.addEventListener('click', function(event) {
        if (event.target === alertModal) {
            closeAlertModal();
        }
    });

    function closeAlertModal() {
        const customAlertModal = document.getElementById('customAlertModal');
        const modalContent = customAlertModal.querySelector('.modal-content');
    
        modalContent.classList.add('fade-out');
        setTimeout(() => {
            modalContent.classList.remove('fade-out');
            customAlertModal.style.display = 'none';
        }, 300);
    }

    okButton.onclick = function() {
        closeAlertModal();
    };

    window.onclick = function(event) {
        if (event.target == alertModal) {
            closeAlertModal();
        }
    };

    
    function adjustElementWidth() {
        const element = modalContent; 
        if (window.matchMedia('(max-width: 1200px)and (min-width: 993px)').matches) {
            element.style.width = '800px';
        } else if (window.matchMedia('(max-width: 992px)').matches) {
            element.style.width = '300px';
        } else {
            element.style.width = '1000px'; 
        }
    }

    
    adjustElementWidth();

    window.addEventListener('resize', adjustElementWidth);

});

