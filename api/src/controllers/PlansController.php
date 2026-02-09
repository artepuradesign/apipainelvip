
<?php
// src/controllers/PlansController.php

require_once __DIR__ . '/../models/Plan.php';
require_once __DIR__ . '/../utils/Response.php';

class PlansController {
    private $db;
    private $plan;
    
    public function __construct($db) {
        $this->db = $db;
        $this->plan = new Plan($db);
    }
    
    public function getAll() {
        try {
            $query = "SELECT * FROM plans ORDER BY sort_order ASC, name ASC";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Processar dados dos planos
            foreach ($plans as &$plan) {
                $plan['id'] = (int)$plan['id'];
                $plan['price'] = (float)$plan['price'];
                $plan['duration_days'] = (int)$plan['duration_days'];
                $plan['consultation_limit'] = (int)$plan['consultation_limit'];
                $plan['is_active'] = (bool)$plan['is_active'];
                $plan['is_popular'] = (bool)$plan['is_popular'];
                $plan['sort_order'] = (int)$plan['sort_order'];
                $plan['discount_percentage'] = (int)$plan['discount_percentage'];
                
                // Campos para compatibilidade com o frontend
                $plan['max_consultations'] = $plan['consultation_limit'];
                $plan['max_api_calls'] = $plan['consultation_limit'];
                
                // Formatação de preço
                $plan['priceFormatted'] = 'R$ ' . number_format($plan['price'], 2, ',', '.');
                
                // Decodificar features
                if ($plan['features']) {
                    $plan['features'] = json_decode($plan['features'], true);
                } else {
                    $plan['features'] = [];
                }
                
                // Processar módulos incluídos
                if ($plan['modules_included']) {
                    $modules = json_decode($plan['modules_included'], true);
                    $plan['modules_included'] = is_array($modules) ? $modules : [];
                } else {
                    $plan['modules_included'] = [];
                }
                
                // Processar painéis incluídos
                if ($plan['panels_included']) {
                    $panels = json_decode($plan['panels_included'], true);
                    $plan['panels_included'] = is_array($panels) ? $panels : [];
                } else {
                    $plan['panels_included'] = [];
                }
                
                // Decodificar theme_colors
                if ($plan['theme_colors']) {
                    $plan['theme'] = json_decode($plan['theme_colors'], true);
                } else {
                    $plan['theme'] = [
                        'colors' => [
                            'primary' => '#6366f1',
                            'secondary' => '#8b5cf6',
                            'accent' => '#06b6d4'
                        ]
                    ];
                }
                
                // Campos de tema para compatibilidade
                $plan['cardSuit'] = $plan['card_suit'];
                $plan['cardType'] = $plan['card_type'];
                $plan['cardTheme'] = $plan['card_theme'];
                $plan['discountPercentage'] = $plan['discount_percentage'];
                
                // Garantir que badge seja string
                $plan['badge'] = $plan['badge'] ?? '';
            }
            
            Response::success($plans, 'Planos carregados com sucesso');
            
        } catch (Exception $e) {
            error_log("PLANS_CONTROLLER GET_ALL ERROR: " . $e->getMessage());
            Response::error('Erro ao carregar planos: ' . $e->getMessage(), 500);
        }
    }
    
    public function getActive() {
        try {
            $query = "SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order ASC, name ASC";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Processar dados dos planos
            foreach ($plans as &$plan) {
                $plan['id'] = (int)$plan['id'];
                $plan['price'] = (float)$plan['price'];
                $plan['duration_days'] = (int)$plan['duration_days'];
                $plan['consultation_limit'] = (int)$plan['consultation_limit'];
                $plan['is_active'] = (bool)$plan['is_active'];
                $plan['is_popular'] = (bool)$plan['is_popular'];
                $plan['sort_order'] = (int)$plan['sort_order'];
                $plan['discount_percentage'] = (int)$plan['discount_percentage'];
                
                $plan['max_consultations'] = $plan['consultation_limit'];
                $plan['max_api_calls'] = $plan['consultation_limit'];
                $plan['priceFormatted'] = 'R$ ' . number_format($plan['price'], 2, ',', '.');
                
                if ($plan['features']) {
                    $plan['features'] = json_decode($plan['features'], true);
                } else {
                    $plan['features'] = [];
                }
                
            // Processar módulos incluídos
            if ($plan['modules_included']) {
                $modules = json_decode($plan['modules_included'], true);
                $plan['modules_included'] = is_array($modules) ? $modules : [];
            } else {
                $plan['modules_included'] = [];
            }
            
            // Processar painéis incluídos
            if ($plan['panels_included']) {
                $panels = json_decode($plan['panels_included'], true);
                $plan['panels_included'] = is_array($panels) ? $panels : [];
            } else {
                $plan['panels_included'] = [];
            }
                
                if ($plan['theme_colors']) {
                    $plan['theme'] = json_decode($plan['theme_colors'], true);
                } else {
                    $plan['theme'] = [
                        'colors' => [
                            'primary' => '#6366f1',
                            'secondary' => '#8b5cf6',
                            'accent' => '#06b6d4'
                        ]
                    ];
                }
                
                $plan['cardSuit'] = $plan['card_suit'];
                $plan['cardType'] = $plan['card_type'];
                $plan['cardTheme'] = $plan['card_theme'];
                $plan['discountPercentage'] = $plan['discount_percentage'];
                
                // Garantir que badge seja string
                $plan['badge'] = $plan['badge'] ?? '';
            }
            
            Response::success($plans, 'Planos ativos carregados com sucesso');
            
        } catch (Exception $e) {
            error_log("PLANS_CONTROLLER GET_ACTIVE ERROR: " . $e->getMessage());
            Response::error('Erro ao carregar planos ativos: ' . $e->getMessage(), 500);
        }
    }
    
    public function getById($id) {
        try {
            $query = "SELECT * FROM plans WHERE id = ?";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([$id]);
            $plan = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$plan) {
                Response::error('Plano não encontrado', 404);
                return;
            }
            
            // Processar dados do plano
            $plan['id'] = (int)$plan['id'];
            $plan['price'] = (float)$plan['price'];
            $plan['duration_days'] = (int)$plan['duration_days'];
            $plan['consultation_limit'] = (int)$plan['consultation_limit'];
            $plan['is_active'] = (bool)$plan['is_active'];
            $plan['is_popular'] = (bool)$plan['is_popular'];
            $plan['sort_order'] = (int)$plan['sort_order'];
            $plan['discount_percentage'] = (int)$plan['discount_percentage'];
            
            $plan['max_consultations'] = $plan['consultation_limit'];
            $plan['max_api_calls'] = $plan['consultation_limit'];
            $plan['priceFormatted'] = 'R$ ' . number_format($plan['price'], 2, ',', '.');
            
            if ($plan['features']) {
                $plan['features'] = json_decode($plan['features'], true);
            } else {
                $plan['features'] = [];
            }
            
            // Processar módulos incluídos
            if ($plan['modules_included']) {
                $modules = json_decode($plan['modules_included'], true);
                $plan['modules_included'] = is_array($modules) ? $modules : [];
            } else {
                $plan['modules_included'] = [];
            }
            
            // Processar painéis incluídos
            if ($plan['panels_included']) {
                $panels = json_decode($plan['panels_included'], true);
                $plan['panels_included'] = is_array($panels) ? $panels : [];
            } else {
                $plan['panels_included'] = [];
            }
            
            if ($plan['theme_colors']) {
                $plan['theme'] = json_decode($plan['theme_colors'], true);
            } else {
                $plan['theme'] = [
                    'colors' => [
                        'primary' => '#6366f1',
                        'secondary' => '#8b5cf6',
                        'accent' => '#06b6d4'
                    ]
                ];
            }
            
            $plan['cardSuit'] = $plan['card_suit'];
            $plan['cardType'] = $plan['card_type'];
            $plan['cardTheme'] = $plan['card_theme'];
            $plan['discountPercentage'] = $plan['discount_percentage'];
            
            // Garantir que badge seja string
            $plan['badge'] = $plan['badge'] ?? '';
            
            Response::success($plan, 'Plano carregado com sucesso');
            
        } catch (Exception $e) {
            error_log("PLANS_CONTROLLER GET_BY_ID ERROR: " . $e->getMessage());
            Response::error('Erro ao carregar plano: ' . $e->getMessage(), 500);
        }
    }
    
    public function create() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                Response::error('Dados de entrada inválidos', 400);
                return;
            }
            
            // Validações básicas
            if (empty($input['name']) || empty($input['slug'])) {
                Response::error('Nome e slug são obrigatórios', 400);
                return;
            }
            
            // Verificar se slug já existe
            $checkQuery = "SELECT id FROM plans WHERE slug = ?";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->execute([$input['slug']]);
            
            if ($checkStmt->fetch()) {
                Response::error('Slug já existe', 400);
                return;
            }
            
            $query = "INSERT INTO plans (name, slug, description, price, duration_days, consultation_limit, features, modules_included, panels_included, category, is_active, is_popular, sort_order, theme_colors, card_theme, card_suit, card_type, discount_percentage, badge) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $features = isset($input['features']) ? json_encode($input['features']) : json_encode([]);
            $modulesIncluded = isset($input['modules_included']) ? json_encode($input['modules_included']) : json_encode([]);
            $panelsIncluded = isset($input['panels_included']) ? json_encode($input['panels_included']) : json_encode([]);
            $themeColors = isset($input['theme']) ? json_encode($input['theme']) : null;
            
            $stmt = $this->db->prepare($query);
            $result = $stmt->execute([
                $input['name'],
                $input['slug'],
                $input['description'] ?? null,
                $input['price'] ?? 0.00,
                $input['duration_days'] ?? 30,
                $input['max_consultations'] ?? $input['consultation_limit'] ?? 0,
                $features,
                $modulesIncluded,
                $panelsIncluded,
                $input['category'] ?? 'basic',
                isset($input['is_active']) ? (int)$input['is_active'] : 1,
                isset($input['is_popular']) ? (int)$input['is_popular'] : 0,
                $input['sort_order'] ?? 0,
                $themeColors,
                $input['cardTheme'] ?? $input['card_theme'] ?? 'default',
                $input['cardSuit'] ?? $input['card_suit'] ?? 'spades',
                $input['cardType'] ?? $input['card_type'] ?? 'queen',
                $input['discountPercentage'] ?? $input['discount_percentage'] ?? 0,
                $input['badge'] ?? null
            ]);
            
            if ($result) {
                $newId = $this->db->lastInsertId();
                Response::success(['id' => $newId], 'Plano criado com sucesso');
            } else {
                Response::error('Erro ao criar plano', 500);
            }
            
        } catch (Exception $e) {
            error_log("PLANS_CONTROLLER CREATE ERROR: " . $e->getMessage());
            Response::error('Erro ao criar plano: ' . $e->getMessage(), 500);
        }
    }
    
    public function update($id) {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                Response::error('Dados de entrada inválidos', 400);
                return;
            }
            
            // Verificar se plano existe
            $checkQuery = "SELECT id FROM plans WHERE id = ?";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->execute([$id]);
            
            if (!$checkStmt->fetch()) {
                Response::error('Plano não encontrado', 404);
                return;
            }
            
            // Verificar quais colunas existem na tabela antes de tentar atualizar
            $columnsQuery = "SHOW COLUMNS FROM plans";
            $columnsStmt = $this->db->prepare($columnsQuery);
            $columnsStmt->execute();
            $existingColumns = [];
            while ($column = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
                $existingColumns[] = $column['Field'];
            }
            
            $setParts = [];
            $values = [];
            
            $fieldMapping = [
                'name' => 'name',
                'slug' => 'slug',
                'description' => 'description',
                'price' => 'price',
                'duration_days' => 'duration_days',
                'max_consultations' => 'consultation_limit',
                'consultation_limit' => 'consultation_limit',
                'features' => 'features',
                'modules_included' => 'modules_included',
                'panels_included' => 'panels_included',
                'category' => 'category',
                'is_active' => 'is_active',
                'is_popular' => 'is_popular',
                'sort_order' => 'sort_order',
                'theme' => 'theme_colors',
                'theme_colors' => 'theme_colors',
                'cardTheme' => 'card_theme',
                'card_theme' => 'card_theme',
                'cardSuit' => 'card_suit',
                'card_suit' => 'card_suit',
                'cardType' => 'card_type',
                'card_type' => 'card_type',
                'discountPercentage' => 'discount_percentage',
                'discount_percentage' => 'discount_percentage',
                'badge' => 'badge',
                'original_price' => 'original_price',
                'max_api_calls' => 'max_api_calls'
            ];
            
            foreach ($fieldMapping as $inputField => $dbField) {
                if (isset($input[$inputField]) && in_array($dbField, $existingColumns)) {
                    $setParts[] = "$dbField = ?";
                    
                    if (in_array($dbField, ['features', 'modules_included', 'panels_included', 'theme_colors'])) {
                        $values[] = json_encode($input[$inputField]);
                    } elseif (in_array($dbField, ['is_active', 'is_popular', 'duration_days', 'consultation_limit', 'sort_order', 'discount_percentage', 'max_api_calls'])) {
                        $values[] = (int)$input[$inputField];
                    } elseif (in_array($dbField, ['price', 'original_price'])) {
                        $values[] = $input[$inputField] !== null ? (float)$input[$inputField] : null;
                    } else {
                        $values[] = $input[$inputField];
                    }
                } elseif (isset($input[$inputField]) && !in_array($dbField, $existingColumns)) {
                    error_log("PLANS_UPDATE: Tentativa de atualizar coluna inexistente: $dbField");
                }
            }
            
            if (empty($setParts)) {
                Response::error('Nenhum campo para atualizar', 400);
                return;
            }
            
            $values[] = $id;
            $query = "UPDATE plans SET " . implode(', ', $setParts) . " WHERE id = ?";
            
            $stmt = $this->db->prepare($query);
            $result = $stmt->execute($values);
            
            if ($result) {
                Response::success(['id' => $id], 'Plano atualizado com sucesso');
            } else {
                Response::error('Erro ao atualizar plano', 500);
            }
            
        } catch (Exception $e) {
            error_log("PLANS_CONTROLLER UPDATE ERROR: " . $e->getMessage());
            Response::error('Erro ao atualizar plano: ' . $e->getMessage(), 500);
        }
    }
    
    public function delete($id) {
        try {
            // Verificar se plano existe
            $checkQuery = "SELECT id FROM plans WHERE id = ?";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->execute([$id]);
            
            if (!$checkStmt->fetch()) {
                Response::error('Plano não encontrado', 404);
                return;
            }
            
            // Verificar se há usuários usando este plano
            $usersQuery = "SELECT COUNT(*) as count FROM user_subscriptions WHERE plan_id = ? AND status = 'active'";
            $usersStmt = $this->db->prepare($usersQuery);
            $usersStmt->execute([$id]);
            $usersCount = $usersStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($usersCount['count'] > 0) {
                Response::error('Não é possível excluir plano que possui assinantes ativos', 400);
                return;
            }
            
            $query = "DELETE FROM plans WHERE id = ?";
            $stmt = $this->db->prepare($query);
            $result = $stmt->execute([$id]);
            
            if ($result) {
                Response::success(null, 'Plano excluído com sucesso');
            } else {
                Response::error('Erro ao excluir plano', 500);
            }
            
        } catch (Exception $e) {
            error_log("PLANS_CONTROLLER DELETE ERROR: " . $e->getMessage());
            Response::error('Erro ao excluir plano: ' . $e->getMessage(), 500);
        }
    }
}
