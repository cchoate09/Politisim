using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class InputStaffExit : MonoBehaviour
{
    public Button mButton;
    public TextMeshProUGUI mInputField;
    public TextMeshProUGUI mText;
    public GameObject deactivate;

    // Start is called before the first frame update
    void Start()
    {
        mButton.onClick.AddListener(onButtonClick);
    }

    void onButtonClick()
    {
        string myVal = mInputField.text;
        myVal = myVal.Remove(myVal.Length - 1, 1);
        if (myVal.Length > 0)
        {
            mText.text = myVal;
        }
        else
        {
            mText.text = "0";
        }
        deactivate.SetActive(false);
    }
}
