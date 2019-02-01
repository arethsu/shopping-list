require 'selenium-webdriver'
require 'capybara/rspec'

Capybara.default_driver = :selenium

Capybara.register_driver :selenium do |app|
  Capybara::Selenium::Driver.new(app, :browser => :chrome)
end

index_file_uri = 'http://localhost:8000/'

describe 'message feed', type: :feature do

  before(:each) do
    visit index_file_uri
  end

  it 'has a text box' do
    expect(page).to have_selector('form input')
  end

  it 'has a submit button' do
    expect(page).to have_selector('form button[type="submit"]')
  end

  it 'supports creation of new messages' do
    fill_in('Message', with: 'Hello there!')
    click_button('Submit')

    fill_in('Message', with: 'Are you tired of the same old shoes?')
    click_button('Submit')

    expect(page).to have_content('Hello there!')
    expect(page).to have_content('Are you tired of the same old shoes?')
  end

  it 'supports marking messages as read' do
    fill_in('Message', with: 'Do not mark me as read!')
    click_button('Submit')

    fill_in('Message', with: 'Mark me as read!')
    click_button('Submit')

    button = page.first('.message div button')

    expect(button).to have_content('☐');
    button.click
    expect(button).to have_content('☑');
    button.click
    expect(button).to have_content('☐');
  end

  it 'errors out when creating a zero length message' do
    click_button('Submit')
    expect(page).to have_content('Message was either empty or too long!')
  end

  it 'errors out when the message is longer than 140 chars' do
    fill_in('Message', with: "A#{'H' * 150}!")
    click_button('Submit')
    expect(page).to have_content('Message was either empty or too long!')
  end

end
