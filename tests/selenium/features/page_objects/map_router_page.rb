# encoding: utf-8

# Map router page - страница с редактором маршрутов
class MapRouterPage
  include RSpec::Matchers

  def visit_map_router_page
    Capybara.visit("/")
  end

  def check_title
    expect(Capybara.has_css?('#map-router-header')).to be true
  end

  def check_map_navigation_panel
    expect(Capybara.has_css?('#map-router-navigation-panel')).to be true
  end

  def check_map
    expect(Capybara.has_css?('#map-router-yandex-map')).to be true
  end
end
