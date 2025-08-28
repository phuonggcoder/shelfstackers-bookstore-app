# Ứng dụng Quản lý Nhà sách ShelfStackers

Ứng dụng web quản lý nhà sách được xây dựng bằng Java và Spring Boot. Dự án này nhằm mục đích cung cấp một hệ thống hiệu quả để quản lý các tác vụ cơ bản của một nhà sách, bao gồm quản lý kho sách, thông tin khách hàng và đơn hàng.

## 🌟 Các Tính Năng Nổi Bật

* **Quản lý Sách:** Xem, thêm, cập nhật và xóa thông tin sách trong kho.
* **Quản lý Khách hàng:** Theo dõi và quản lý thông tin khách hàng.
* **Quản lý Đơn hàng:** Xử lý và theo dõi các đơn hàng của khách.
* **Chức năng Tìm kiếm & Lọc:** Dễ dàng tìm kiếm sách theo tên, tác giả hoặc thể loại.
* **Giao diện thân thiện:** Giao diện người dùng trực quan, dễ dàng sử dụng.

---

## 🛠️ Công Nghệ Sử Dụng

Dự án được xây dựng dựa trên các công nghệ sau:

* **Back-end:**
    * Java
    * Spring Boot
    * Spring Data JPA
    * Spring Security (nếu có)
* **Front-end:**
    * React Native
* **Cơ sở dữ liệu:**
    * MongoDB, NodeJS 
* **Quản lý dependencies:**
    * npm, Gradle

---

## 🚀 Hướng Dẫn Cài Đặt và Chạy Dự Án

### 1. Yêu Cầu

Đảm bảo rằng bạn đã cài đặt các công cụ sau trên máy tính của mình:

* Java Development Kit (JDK) 11 trở lên
* Maven
* Một hệ quản trị cơ sở dữ liệu (ví dụ: MySQL, PostgreSQL)

### 2. Cài Đặt

1.  **Clone repository:**
    ```bash
    git clone [https://github.com/phuonggcoder/shelfstackers-bookstore-app.git](https://github.com/phuonggcoder/shelfstackers-bookstore-app.git)
    cd shelfstackers-bookstore-app
    ```

2.  **Cấu hình cơ sở dữ liệu:**
    * Tạo một cơ sở dữ liệu mới (ví dụ: `shelfstackers_db`).
    * Mở file `src/main/resources/application.properties` (hoặc `application.yml`).
    * Cập nhật thông tin kết nối cơ sở dữ liệu của bạn:
        ```properties
        # Ví dụ cho MySQL
        spring.datasource.url=jdbc:mysql://localhost:3306/shelfstackers_db
        spring.datasource.username=root
        spring.datasource.password=your_password
        spring.jpa.hibernate.ddl-auto=update
        ```

3.  **Build dự án:**
    ```bash
    mvn clean install
    ```

4.  **Chạy ứng dụng:**
     npm


**© 2025 - phuonggcoder**
