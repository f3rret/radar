# Radar
Система контроля подключений к локальной сети / IDS.

### Класс ПО
Сканер сети с накоплением данных, система обнаружения вторжений.

### Назначение
ПО предназначено для контроля подлкючений клиентов LAN, учета и мониторинга их конфигурации, обнаружения несанкционированных подключений.

### Исполнение
ПО представляет собой набор скриптов Perl для выполнения на стороне веб-сервера и HTML-страницу для управления функционалом. Пользовательский интерфейс страницы обеспечивается с помощью jQuery. 

### Область применения
Администрирование локальных вычислительных сетей со сложной распределенной топологией, множеством точек доступа. Организации с повышенными требованиями с безопасности информационной инфраструктуры.

### Требования к пользователю
Базовый навык администрирования ОС Linux.

### Описание решения
По своей сути "Радар" является надстройкой, объединяющей функционал системных утилит netdiscover, nmap, nbtscan, ping и arping с СУБД, что позволяет вести учет и производить анализ изменений структуры локальной сети. Основной интерфейс выполнен в виде интерактивной таблицы с данными из СУБД, элементы управления позволяют пользователю выполнять сканирование отдельного хоста или всего сегмента. Полученные данные анализируются скриптами js на стороне клиента и сигнализируют об обнаруженных проблемах, накапливая результаты сканирования в базе данных.

### Пользовательский интерфейс

![main](https://user-images.githubusercontent.com/100901877/161962460-399897c4-b0ea-4a96-89bc-1dcc5294e23b.png)

Три основные вкладки List, Netdiscover и Log позволяют переключаться между основным видом (представлен на скриншоте), интерфейсом сканера и интерфейсом вывода логов. Элементы управления в правом верхнем углу основного интерфейса позволяют фильтровать строки таблицы в зависимости от типа обнаруженных проблем - хост недоступен (серый фильтр), потери пакетов (желтый фильтр), несовпадение mac/ несовпадение netbios имени/ незарегистрированный хост (красный фильтр). Там же доступен переключатель между сетевыми интерфейсами сервера и кнопка запуска полного циклического сканирования.

Левый клик по заголовкам таблицы nbname, ping, arping, ports запустит пакетное сканирование соответствующего типа для выделенных строк. Выделение нескольких строк осуществляется с помощью клавиши Shift. Правый клик на строке таблицы откроет диалоговое окно детальной информации.

![dialog](https://user-images.githubusercontent.com/100901877/161967735-c75af9fc-00d1-4a9d-8337-0aa5008a357f.png)

В диалоговом окне представлены вкладки: Command output - вывод последней выполненной команды, Nmap - результат выполнения сканирования портов и Print - интерфейс "отпечатков" хоста. Отпечаток - это совокупность сведений о хосте, полученных в результате сканирования, по ним система определяет изменения в конфигурации. Отпечатки накапливаются в базе данных и служат для детального анализа истории изменений и поиска совпадений. В правом верхнем углу диалогового окна присутствуют кнопки запуска команд сканирования хоста - nmap, nbtscan, ping, arping.

Пуск/останов режима анализа сетевой активности в сегменте осуществляется с помощью кнопки "►" вкладки Netdiscover. Все обнаруженные незарегистрированные хосты будут автоматически добавлены в начало основной таблицы и отмечены красным фильтром. Подробный вывод команды netdiscover будет представлен в соответствующем поле этой вкладки.

### Установка и настройка
Для развертывания системы рекомендуется использовать свежий дистрибутив Kali Linux или любой другой дистрибутив Linux/BSD. Ниже будут представлены инструкции по установке для Debian-based дистрибутивов.

1. Развертывание веб-сервера Apache2 (или любого другого веб-сервера с поддержкой CGI) согласно официальной инструкции поставщика. Необходимо ограничить доступ к веб-серверу извне и подключить обработчик Perl. Ниже представлен пример конфигурации виртуального хоста для Apache2: 
``` 
<VirtualHost *:80>
	ServerName radar

	ServerAdmin webmaster@radar
	DocumentRoot /var/www/html
	ErrorLog ${APACHE_LOG_DIR}/error.log
	CustomLog ${APACHE_LOG_DIR}/access.log combined
	ScriptAlias /cgi-bin/ "var/www/html/ids/cgi-bin"
	
	<Directory /var/www/html/>
	    AuthType Basic
	    AuthName "Radar"
	    AuthBasicProvider file
	    AuthUserFile "/etc/apache2/passwords"
	    Require user admin
	</Directory>

	<Directory /var/www/html/ids/cgi-bin>
	    Require ip 192.168.0.55 
	    AllowOverride None
	    Options +ExecCGI -Includes
	    AddHandler cgi-script .cgi .pl .pm
	</Directory>
</VirtualHost>
```

2. Установка необходимых пакетов: ` apt-get update && apt-get install iputils-ping arping nbtscan nmap netdiscover `

3. Необходимо задать разрешения для учетной записи веб-сервера для запуска системных утилит в файле /etc/sudoers:
```
www-data	ALL = (root) NOPASSWD:/usr/bin/arping,/usr/bin/nbtscan,/var/www/html/ids/cgi-bin/ndstart.sh,/var/www/html/ids/cgi-bin/ndstop.sh,/var/www/html/ids/cgi-bin/ndstat.sh,/usr/bin/nmap
```
4. Развертывание СУБД MariaDB (MySQL) согласно официальной инструкции поставщика.

5. Создание структуры таблиц СУБД:
```
CREATE TABLE `main` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(15) NOT NULL,
  `mac` varchar(17) DEFAULT '',
  `nbname` varchar(250) DEFAULT '',
  `description` varchar(250) DEFAULT '',
  `iface` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5174 DEFAULT CHARSET=utf8;

CREATE TABLE `prints` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ipid` int(11) DEFAULT NULL,
  `print` text DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=950 DEFAULT CHARSET=utf8;
```

6. Создание первоначальных данных о хостах может производиться добавлением строк в таблицу main вручную либо импортом из CSV-файла с помощью скрипта ids/cgi-bin/filldb.pl. Ниже приведен пример содержимого файла CSV:
```
00:1E:67:AE:9C:A6;192.168.0.1;server1;;
F4:6D:04:D4:72:CA;192.168.0.2;server2;;
00:1e:58:9a:24:94;192.168.0.3;router;;
00:19:DB:DC:C8:F1;192.168.0.7;computer1;Рабочая станция;;
```
Перед запуском скрипта необходимо открыть его в текстовом редакторе и подставить имя файла для импорта (по умолчанию - 0.csv) и интерфейс (по умолчанию -  eth0).

7. Копирование содержимого репозитория в каталог веб-сервера:
```
cp -r ids /var/www/html/
```

### Устранение неполадок

- Проверка работоспособности веб-сервера производится путем обращения к странице http://radar/ids/cgi-bin/env.pl Если настройка произведена корректно, ответ будет содержать вывод следующего содержания:
```
SERVER_ADMIN => webmaster@radar
SCRIPT_NAME => /ids/cgi-bin/env.pl
CONTEXT_PREFIX =>
QUERY_STRING =>
SERVER_PORT => 80
SERVER_ADDR => 192.168.0.54
REMOTE_PORT => 50299
PATH => /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HTTP_USER_AGENT => Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36
GATEWAY_INTERFACE => CGI/1.1
SCRIPT_FILENAME => /var/www/html/ids/cgi-bin/env.pl
REQUEST_METHOD => GET
HTTP_UPGRADE_INSECURE_REQUESTS => 1
CONTEXT_DOCUMENT_ROOT => /var/www/html
HTTP_CONNECTION => keep-alive
HTTP_ACCEPT_LANGUAGE => ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7
DOCUMENT_ROOT => /var/www/html
HTTP_ACCEPT => text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
HTTP_ACCEPT_ENCODING => gzip, deflate
REQUEST_SCHEME => http
REQUEST_URI => /ids/cgi-bin/env.pl
SERVER_SOFTWARE => Apache/2.4.25 (Debian)
REMOTE_ADDR => 192.168.0.55
SERVER_PROTOCOL => HTTP/1.1
HTTP_HOST => radar
SERVER_NAME => radar
SERVER_SIGNATURE =>
Apache/2.4.25 (Debian) Server at radar Port 80
```

- Установка имени хоста сервера осуществляется с помощью команды `hostname -b radar` (необязательно).
- Перезапуск веб-сервера осуществляется командой `systemctl restart apache2`.
- Перезапуск службы СУБД осуществляется аналогично `systemctl restart mariadb`.
- Отладочная информация доступна в журнале системы `journalctl -r` и логах веб-сервера /var/log/apache2.
