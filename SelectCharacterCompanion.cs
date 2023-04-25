using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class SelectCharacterCompanion : MonoBehaviour
{
    public int index = 0;
    public List <SelectCharacter> tabButtons;
    public Sprite tabIdle;
    public Sprite tabHover;
    public Sprite tabActive;
    public SelectCharacter selectedTab;
    public List<GameObject> objectsToSwap;

    // Start is called before the first frame update
    public void Subscribe(SelectCharacter button)
    {
        if (tabButtons == null)
        {
            tabButtons = new List<SelectCharacter>();
        }

        tabButtons.Add(button);
        button.background.sprite = tabIdle;
    }
    
    
    public void OnTabEnter(SelectCharacter button)
    {
        ResetTabs();
        if (selectedTab == null || button != selectedTab)
        {
            button.background.sprite = tabHover;
        }
    }

    public void OnTabExit(SelectCharacter button)
    {
        ResetTabs();
        button.background.sprite = tabActive;
    }

    public void OnTabSelected(SelectCharacter button)
    {
        selectedTab = button;
        ResetTabs();
        button.background.sprite = tabActive;
        index = button.transform.GetSiblingIndex();
        for(int i = 0; i < objectsToSwap.Count; i++)
        {
            if (i == index)
            {
                objectsToSwap[i].SetActive(true);
            }
            else
            {
                objectsToSwap[i].SetActive(false);
            }

        }
    }

    public void ResetTabs()
    {
        foreach(SelectCharacter button in tabButtons)
        {
            if (selectedTab != null && selectedTab == button)
            {
                continue;
            }
            else
            {
                button.background.sprite = tabIdle;
            }
        }
    }
}
