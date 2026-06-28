import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TagFilterCombobox from '@/components/resources/TagFilterCombobox'

describe('TagFilterCombobox', () => {
  const options = ['perspective', 'fundamentals', 'anatomy', 'character']

  it('shows fuzzy suggestions while typing', () => {
    const onChange = vi.fn()
    render(
      <TagFilterCombobox
        value={null}
        options={options}
        onChange={onChange}
        allTagsLabel="All tags"
      />,
    )
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'perspect' } })
    expect(screen.getByRole('option', { name: 'perspective' })).toBeInTheDocument()
  })

  it('selects a tag from suggestions', () => {
    const onChange = vi.fn()
    render(
      <TagFilterCombobox
        value={null}
        options={options}
        onChange={onChange}
        allTagsLabel="All tags"
      />,
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'fund' } })
    fireEvent.click(screen.getByRole('option', { name: 'fundamentals' }))
    expect(onChange).toHaveBeenCalledWith('fundamentals')
  })

  it('clears selection with clear button', () => {
    const onChange = vi.fn()
    render(
      <TagFilterCombobox
        value="anatomy"
        options={options}
        onChange={onChange}
        allTagsLabel="All tags"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'All tags' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
