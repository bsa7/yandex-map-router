# encoding: utf-8

When(/^Пользователь открывает страницу с редактором маршрутов$/) do
  map_router_page = MapRouterPage.new
  map_router_page.visit_map_router_page
end

When(/^Пользователь видит заголовок страницы, панель со списком точек маршрута и карту$/) do
  map_router_page = MapRouterPage.new
  map_router_page.visit_map_router_page
  map_router_page.check_title
  map_router_page.check_map_navigation_panel
  map_router_page.check_map
end
