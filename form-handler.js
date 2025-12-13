// form-handler.js - Archivo JavaScript para manejar el formulario
(function() {
    'use strict';
    
    // Variables globales
    let deviceInfo = {
        ip: 'No disponible',
        deviceName: 'No disponible',
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString()
    };
    
    // Función para obtener información del dispositivo
    async function fetchDeviceInfo() {
        try {
            // Intentamos obtener la IP pública
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            deviceInfo.ip = ipData.ip;
            
            // Obtenemos el nombre del dispositivo
            deviceInfo.deviceName = navigator.platform || 'Dispositivo desconocido';
            
            // Detectar tipo de dispositivo más específico
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            deviceInfo.deviceType = isMobile ? 'Móvil' : 'Escritorio';
            
            // Mostrar información en el footer
            const deviceInfoEl = document.getElementById('device-info');
            deviceInfoEl.innerHTML = `
                <i class="fas fa-desktop"></i> ${deviceInfo.deviceType} | 
                <i class="fas fa-microchip"></i> ${deviceInfo.deviceName} | 
                <i class="fas fa-network-wired"></i> ${deviceInfo.ip}
            `;
                
        } catch (error) {
            console.log('No se pudo obtener información completa del dispositivo:', error);
            document.getElementById('device-info').innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> Información limitada | 
                <i class="fas fa-network-wired"></i> IP no disponible
            `;
        }
    }
    
    // Función para validar el formulario
    function validateForm(formData) {
        const errors = [];
        
        if (!formData.fullName.trim()) errors.push('El nombre completo es obligatorio');
        if (!formData.discordName.trim()) errors.push('El nombre de Discord es obligatorio');
        if (!formData.epicName.trim()) errors.push('El nombre de Epic Games es obligatorio');
        if (!formData.region) errors.push('Debes seleccionar una región');
        if (!formData.platform) errors.push('Debes seleccionar una plataforma');
        
        // Validar formato de Discord (sin #)
        const discordRegex = /^[a-zA-Z0-9_.]{2,32}$/;
        if (formData.discordName.trim() && !discordRegex.test(formData.discordName.trim())) {
            errors.push('Formato de Discord inválido. Solo letras, números, puntos y guiones bajos (2-32 caracteres)');
        }
        
        return errors;
    }
    
    // Función para mostrar mensajes de estado
    function showStatusMessage(message, type) {
        const statusEl = document.getElementById('status-message');
        statusEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        statusEl.className = `status-message ${type}`;
        statusEl.style.display = 'block';
        
        // Ocultar después de 5 segundos si es un éxito
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }
    
    // Función para enviar datos al webhook
    async function sendToWebhook(formData) {
        const webhookURL = 'https://discord.com/api/webhooks/1449446123256156374/2nOWrsRxfnTlNJU3loWuTnDL-dhHlU4zW2BmZeBD_zkc4S5cIlqRcukCH50pBJFUOuFU';
        
        // Crear el contenido para Discord
        const discordContent = {
            embeds: [{
                title: '🎮 NUEVA INSCRIPCIÓN - Skin Victory Cup',
                color: 0x8a2be2,
                thumbnail: {
                    url: 'https://cdn.discordapp.com/attachments/1028193082896355348/1192984302999572580/NHXRK.png'
                },
                fields: [
                    {
                        name: '👤 NOMBRE COMPLETO',
                        value: formData.fullName,
                        inline: true
                    },
                    {
                        name: '💬 DISCORD NAME',
                        value: formData.discordName,
                        inline: true
                    },
                    {
                        name: '🎮 EPIC GAMES',
                        value: formData.epicName,
                        inline: true
                    },
                    {
                        name: '🌍 REGIÓN',
                        value: formData.region,
                        inline: true
                    },
                    {
                        name: '🖥️ PLATAFORMA',
                        value: formData.platform,
                        inline: true
                    },
                    {
                        name: '📊 INFORMACIÓN ADICIONAL',
                        value: formData.additionalInfo || 'No proporcionada',
                        inline: false
                    },
                    {
                        name: '📱 INFORMACIÓN TÉCNICA',
                        value: `IP: ${deviceInfo.ip}\nDispositivo: ${deviceInfo.deviceName} (${deviceInfo.deviceType})\nResolución: ${deviceInfo.screenResolution}`,
                        inline: false
                    }
                ],
                footer: {
                    text: `Skin Victory Cup • ${new Date().toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}`
                }
            }]
        };
        
        try {
            const response = await fetch(webhookURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(discordContent)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error al enviar al webhook:', error);
            return false;
        }
    }
    
    // Función para manejar el envío del formulario
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        // Obtener datos del formulario
        const formData = {
            fullName: document.getElementById('full-name').value,
            discordName: document.getElementById('discord-name').value,
            epicName: document.getElementById('epic-name').value,
            region: document.getElementById('region').value,
            platform: document.getElementById('platform').value,
            additionalInfo: document.getElementById('additional-info').value
        };
        
        // Validar
        const errors = validateForm(formData);
        if (errors.length > 0) {
            showStatusMessage(errors.join('<br>'), 'error');
            return;
        }
        
        // Cambiar estado del botón a "enviando"
        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading"></div> Enviando inscripción...';
        submitBtn.disabled = true;
        
        try {
            // Enviar al webhook
            const success = await sendToWebhook(formData);
            
            if (success) {
                // Mostrar mensaje de éxito
                showStatusMessage('✅ ¡Inscripción enviada con éxito!<br>Recibirás más información por Discord en los próximos días.', 'success');
                
                // Efecto visual de éxito
                submitBtn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
                submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Inscrito!';
                
                // Limpiar formulario después de un breve delay
                setTimeout(() => {
                    document.getElementById('registration-form').reset();
                    submitBtn.style.background = '';
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 3000);
                
                // Registrar en consola (solo para desarrollo)
                console.log('Inscripción enviada:', {
                    ...formData,
                    deviceInfo,
                    timestamp: new Date().toISOString()
                });
            } else {
                throw new Error('Error en el servidor al procesar la inscripción');
            }
        } catch (error) {
            showStatusMessage('❌ Error al enviar la inscripción.<br>Por favor, inténtalo de nuevo en unos minutos.', 'error');
            console.error('Error:', error);
            
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Función para mejorar la experiencia de los select
    function enhanceSelects() {
        const selects = document.querySelectorAll('select.form-control');
        selects.forEach(select => {
            select.addEventListener('focus', function() {
                this.parentElement.style.transform = 'scale(1.02)';
            });
            
            select.addEventListener('blur', function() {
                this.parentElement.style.transform = 'scale(1)';
            });
            
            // Cambiar color del ícono cuando se selecciona una opción
            select.addEventListener('change', function() {
                if (this.value) {
                    this.parentElement.querySelector('i').style.color = '#a855f7';
                } else {
                    this.parentElement.querySelector('i').style.color = '';
                }
            });
        });
    }
    
    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Obtener información del dispositivo
        fetchDeviceInfo();
        
        // Configurar manejador del formulario
        document.getElementById('registration-form').addEventListener('submit', handleFormSubmit);
        
        // Mejorar experiencia de selects
        enhanceSelects();
        
        // Añadir animaciones a los elementos
        const cards = document.querySelectorAll('.info-card, .form-group');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
        
        // Cargar imagen del banner (con fallback si hay error)
        const bannerImg = document.getElementById('tournament-banner');
        bannerImg.onerror = function() {
            // Si la imagen no se carga, mostrar un placeholder con estilo
            this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="250" viewBox="0 0 900 250"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:%238a2be2;stop-opacity:1" /><stop offset="100%" style="stop-color:%23a855f7;stop-opacity:1" /></linearGradient></defs><rect width="900" height="250" fill="%231a1525"/><rect x="10" y="10" width="880" height="230" rx="12" fill="url(%23grad)" fill-opacity="0.2"/><text x="450" y="120" font-family="Arial, sans-serif" font-size="32" fill="%23f0f0f0" text-anchor="middle" font-weight="bold">SKIN VICTORY CUP</text><text x="450" y="160" font-family="Arial, sans-serif" font-size="18" fill="%23a855f7" text-anchor="middle">Torneo Oficial de Fortnite</text><text x="450" y="190" font-family="Arial, sans-serif" font-size="14" fill="%23c7c7d1" text-anchor="middle">4 de Enero 2024 - 18:00 (Hora Española)</text></svg>';
            console.log('Imagen del banner no encontrada, usando placeholder');
        };
        
        // Añadir efecto de entrada a los inputs
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('glow-effect');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('glow-effect');
            });
        });
    });
})();