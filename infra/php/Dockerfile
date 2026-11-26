FROM php:8.2-apache
RUN docker-php-ext-install pdo_mysql opcache && a2enmod rewrite
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/*.conf \
    && printf '<Directory /var/www/html/public>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/parking.conf \
    && a2enconf parking
COPY . /var/www/html
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && printf 'opcache.enable=1\nopcache.memory_consumption=128\nopcache.max_accelerated_files=20000\nopcache.validate_timestamps=0\nmemory_limit=128M\nexpose_php=Off\n' > /usr/local/etc/php/conf.d/parking.ini \
    && printf '<IfModule mpm_prefork_module>\nStartServers 2\nMinSpareServers 2\nMaxSpareServers 4\nServerLimit 8\nMaxRequestWorkers 8\nMaxConnectionsPerChild 1000\n</IfModule>\nKeepAlive On\nKeepAliveTimeout 2\n' > /etc/apache2/conf-available/parking-workers.conf \
    && a2enconf parking-workers
CMD ["sh", "-c", "php artisan config:cache && php artisan route:cache && php artisan view:cache && chown -R www-data:www-data storage bootstrap/cache && apache2-foreground"]
